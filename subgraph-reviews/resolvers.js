import {
  AuthenticationError,
  ForbiddenError,
} from "../infrastructure/utils/errors.js";
import { requireAuth, requireRole } from "../infrastructure/auth/authAndRole.js";
import reviewRepository from "../services/repositories/reviewRepository.js";
import getUserFromDb from "../services/repositories/userRepository.js";

const resolvers = {
  Query: {
    searchReviews: async (_, { criteria }) => {
      return reviewRepository.searchReviews(criteria);
    },

    reviews: async (_, { id }, __) => {
      const review = await reviewRepository.getReviewById(id);
      if (!review) throw new ForbiddenError("Review not found");
      return review;
    },

    getReviewForListing: async (_, { listingId }) => {
      return reviewRepository.getReviewsByListingId(listingId);
    },
  },
  Mutation: {
    submitGuestReview: requireAuth(async (_, { guestReview, bookingId }, { userId, dataSources }) => {
      const booking = await dataSources.bookingService.getBooking(bookingId);
      if (!booking || booking.status !== "complete") {
        throw new ForbiddenError("Invalid booking status for review submission");
      }
      return reviewRepository.createGuestReview(guestReview, bookingId, userId, booking.guestId);
    }),

    submitHostAndLocationReviews: requireRole("HOST", async (_, args, context) => {
      return reviewRepository.createHostAndLocationReviews(args, context);
    }),

    Listing: {
      overallRating: ({ id }, _, { dataSources }) => {
        const { reviewService } = dataSources;
        return reviewService.getOverallRatingForListing(id);
      },
      reviews: ({ id }, _, { dataSources }) => {
        const { reviewService } = dataSources;
        return reviewService.getReviewsForListing(id);
      },
      __resolveReference: async (id, { dataSources }) => {
        return dataSources.listingService.getListing(id);
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
      __resolveReference: ({ id }, { dataSources }) => {
        const { userService } = dataSources;
        return userService.getUserFromDb(id);
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
      __resolveReference: async ({ id }, { dataSources }) => {
        return dataSources.reviewService.getReview(id);
      },
    },

    User: {
      __resolveType: ({ role }) => role,
    },
  }
};

export default resolvers;
