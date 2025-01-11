import { AuthenticationError, ForbiddenError } from "../infrastructure/utils/errors.js";
import { requireAuth, requireRole } from "../infrastructure/auth/authAndRole.js";
import { searchReviews } from "../infrastructure/search/searchReviews.js";
import Review from "../services/models/review.js";
import driver from "../services/DB/connectNeo4jDB.js";
import getUserFromDb from "../services/repositories/userRepository.js";

const resolvers = {
  Query: {
    searchReviews: async (_, { criteria }, context) => {
      try {
        const session = driver.session();
        // according to the criteria to create query clauses
        // assume that criteria includes guestId, authorId,listingId etc
        let query = `
       MATCH (r:Review)
       WHERE true
       `
        let params = {};
        if (criteria.guestId) {
          query += ` AND r.guestId = $guestId`;
          params = { ...params, guestId: criteria.guestId };
        }
        if (criteria.authorId) {
          query += ` AND r.authorId = $authorId`;
          params = { ...params, authorId: criteria.authorId };
        }
        if (criteria.listingId) {
          query += ` AND r.listingId = $listingId`;
          params = { ...params, listingId: criteria.listingId };
        }
        if (criteria.sortBy) {
          query += ` ORDER BY r.${criteria.sortBy}`;
        }
        if (criteria.limit) {
          query += ` LIMIT $limit`;
          params = { ...params, limit: criteria.limit };
        }
        if (criteria.offset) {
          query += ` SKIP $offset`;
          params = { ...params, offset: criteria.offset };
        }
        const results = await session.run(query, params);
        session.close();
        return results.records.map(record => record.get('r').properties);
      } catch (error) {
        throw new ApolloError(`Failed to search reviews: ${error.message}`, 'INTERNAL_SERVER_ERROR');
      }
    },

    reviews: async (_, { id }, __) => {
      try {
        const session = driver.session();
        const result = await session.run(
          `
          MATCH (r:Review {id: $id})
          RETURN r
          `,
          { id }
        );
        session.close()
        if (result.records.length > 0) {
          return result.records[0].get('r').properties;
        }
      } catch (error) {
        throw new NotFoundError(`Failed to fetch review: ${error.message}`);
      }
    },
    getReviewForListing: async (_, { listingId }, context) => {
      try {
        const session = driver.session()
        const result = await session.run(
          `
          MATCH (r:Review)-[:ASSOCIATED_WITH]->(l:Listing {id: $listingId})
            RETURN r
          `,
          { listingId }
        )
        session.close()
        return result.records.map(record => record.get('r').properties);
      } catch (error) {
        throw new ApolloError('Error fetching reviews for listing', 'INTERNAL_SERVER_ERROR', { error });
      }
    },
  },
  Mutation: {
    submitGuestReview: requireAuth(
      async (
        _,
        { guestReview: guestReviewInput, bookingId },
        { dataSources, userId }
      ) => {
        const { reviewService, bookingService } = dataSources;
        const booking = await bookingService.getBooking(bookingId);

        if (!booking) {
          throw new ForbiddenError("Booking not found", { extensions: { code: 'NOT_FOUND' } });
        }

        if (booking.status !== 'complete') {
          throw new ForbiddenError("You can't review this booking now", { extensions: { code: 'UNSUPPORTED' } });
        }

        try {
          const session = driver.session();
          const result = await session.run(
            `
          MATCH (b:Booking {id: $bookingId})
          MERGE (r:Review {
            content: $content,
            rating: $rating,
            authorId: $authorId,
            bookingId: $bookingId,
            createdAt: datetime(),
            updatedAt: datetime()
          })
          MERGE (r)-[:SUBMITTED_BY]->(g:Guest {id: $guestId})
          RETURN r
        `,
            {
              bookingId,
              content: guestReviewInput.content,
              rating: guestReviewInput.rating,
              authorId: userId,
              guestId: booking.guestId
            }
          );
          if (result.records.length === 0) {
            throw new ApolloError('Failed to submit guest review', 'INTERNAL_SERVER_ERROR');
          }
          return {
            code: 200,
            success: true,
            message: 'Guest review submitted successfully',
            guestReview: result.records[0].get('r').properties
          };
        } catch (error) {
          throw new ApolloError('Error submitting guest review', 'INTERNAL_SERVER_ERROR', { error });
        }
      }),

    submitHostAndLocationReviews: requireRole(
      'HOST',
      async (
        _,
        { hostReview: hostReviewInput, bookingId, locationReview: locationReviewInput },
        { dataSources, userId }
      ) => {
        const { listingService, bookingService, reviewService } = dataSources;
        const booking = await bookingService.getBooking(bookingId);

        if (!booking) {
          throw new ForbiddenError("Booking not found", { extensions: { code: 'NOT_FOUND' } });
        }

        const session = driver.session();

        try {
          // retrieve listingId and hostId
          const listingResult = await session.run(
            `
          MATCH (b:Booking {id: $bookingId})-[:BOOKED_FOR]->(l:Listing)
          RETURN l.id AS listingId, l.hostId AS hostId
          `,
            { bookingId }
          );

          if (listingResult.records.length === 0) {
            throw new ForbiddenError("Listing not found", { extensions: { code: 'NOT_FOUND' } });
          }

          const { listingId, hostId } = listingResult.records[0].get('listingId');

          // 创建 location review
          const locationReviewResult = await session.run(
            `
          MATCH (l:Listing {id: $listingId})
          MERGE (r:Review {
            content: $content,
            rating: $rating,
            authorId: $authorId,
            listingId: $listingId,
            bookingId: $bookingId,
            createdAt: datetime(),
            updatedAt: datetime()
          })
          MERGE (r)-[:FOR_LISTING]->(l)
          RETURN r
          `,
            {
              listingId,
              content: locationReviewInput.content,
              rating: locationReviewInput.rating,
              authorId: userId,
              bookingId
            }
          );

          const locationReview = locationReviewResult.records[0].get('r').properties;

          // 创建 host review
          const hostReviewResult = await session.run(
            `
          MATCH (h:Host {id: $hostId})
          MERGE (r:Review {
            content: $content,
            rating: $rating,
            authorId: $authorId,
            hostId: $hostId,
            bookingId: $bookingId,
            createdAt: datetime(),
            updatedAt: datetime()
          })
          MERGE (r)-[:FOR_HOST]->(h)
          RETURN r
          `,
            {
              hostId,
              content: hostReviewInput.content,
              rating: hostReviewInput.rating,
              authorId: userId,
              bookingId
            }
          );

          const hostReview = hostReviewResult.records[0].get('r').properties;

          session.close();

          return {
            code: 200,
            success: true,
            message: "Location and host reviews successfully created",
            locationReview,
            hostReview
          };
        } catch (error) {
          session.close();
          throw new ApolloError('Error submitting reviews', 'INTERNAL_SERVER_ERROR', { error });
        }
      }),
  },

  Listing: {
    overallRating: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getOverallRatingForListing(id);
    },
    reviews: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getReviewsForListing(id);
    },
    __resolveReference: async (listing, { dataSources }) => {
      return dataSources.listingService.getListing(listing.id);
    },

  },

  Booking: {
    guestReview: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getReviewForBooking("GUEST", id);
    },
    hostReview: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getReviewForBooking("HOST", id);
    },
    locationReview: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getReviewForBooking("LISTING", id);
    },
  },

  Host: {
    overallRating: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getOverallRatingForHost(id);
    },
    __resolveReference: (user, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getUser(user.id);
    },
  },

  Guest: {
    __resolveReference: (user, { dataSources }) => {
      const { userService } = dataSources;
      return userService.getUserFromDb(user.id);
    },
  },

  Review: {
    author: (review) => {
      let role = "";
      if (review.targetType === "LISTING" || review.targetType === "HOST") {
        role = "Guest";
      } else {
        role = "Host";
      }
      return { __typename: role, id: review.authorId };
    },
    isFeatured: ({ id }, _, { dataSources }) => {
      const { listingService } = dataSources;
      return listingService.isFeatured(id);
    },
    likesCount: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getLikeCount(id);
    },
    dislikesCount: ({ id }, _, { dataSources }) => {
      const { reviewService } = dataSources;
      return reviewService.getDislikeCount(id);
    },
    booking: async ({ bookingId }, _, { dataSources }) => {
      return dataSources.bookingService.getBooking(bookingId);
    },

    createdAt: ({ createdAt }) => new Date(createdAt).toISOString(),

    // Resolve reference for federated queries
    __resolveReference: async (review, { dataSources }) => {
      return dataSources.reviewService.getReview(review.id);
    },
  },

  User: {
    __resolveType(user) {
      return user.role;
    },
  },
};

export default resolvers;
