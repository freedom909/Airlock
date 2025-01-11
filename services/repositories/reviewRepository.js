import driver from '../DB/connectNeo4jDB.js';
import { GraphQLError } from 'graphql';

class ReviewRepository {
  async createReview(reviewData) {
    const session = driver.session();
    try {
      const result = await session.run(
        `
        CREATE (r:Review {
          id: $id,
          content: $content,
          rating: $rating,
          authorId: $authorId,
          listingId: $listingId,
          hostId: $hostId,
          bookingId: $bookingId,
          targetType: $targetType,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        RETURN r
        `,
        reviewData
      );
      return result.records[0].get('r').properties;
    } catch (error) {
      throw new GraphQLError(`Failed to create review: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    } finally {
      session.close();
    }
  }

  async getAverageRating({ targetType, listingId = null, hostId = null }) {
    const session = driver.session();
    try {
      const query = `
        MATCH (r:Review {targetType: $targetType})
        ${listingId ? `WHERE r.listingId = $listingId` : ''}
        ${hostId ? `WHERE r.hostId = $hostId` : ''}
        RETURN avg(r.rating) AS averageRating
      `;
      const result = await session.run(query, { targetType, listingId, hostId });
      return result.records[0].get('averageRating');
    } catch (error) {
      throw new GraphQLError(`Failed to get average rating: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    } finally {
      session.close();
    }
  }

  async getReviews({ targetType, listingId = null, hostId = null }) {
    const session = driver.session();
    try {
      const query = `
        MATCH (r:Review {targetType: $targetType})
        ${listingId ? `WHERE r.listingId = $listingId` : ''}
        ${hostId ? `WHERE r.hostId = $hostId` : ''}
        RETURN r
      `;
      const result = await session.run(query, { targetType, listingId, hostId });
      return result.records.map(record => record.get('r').properties);
    } catch (error) {
      throw new GraphQLError(`Failed to get reviews: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    } finally {
      session.close();
    }
  }

  async getReview({ targetType, bookingId }) {
    const session = driver.session();
    try {
      const result = await session.run(
        `
        MATCH (r:Review {targetType: $targetType, bookingId: $bookingId})
        RETURN r
        `,
        { targetType, bookingId }
      );
      if (result.records.length > 0) {
        return result.records[0].get('r').properties;
      }
      return null;
    } catch (error) {
      throw new GraphQLError(`Failed to get review: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    } finally {
      session.close();
    }
  }
}

export default ReviewRepository;