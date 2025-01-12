import connect from '../DB/connectNeo4jDB.js';
import { GraphQLError } from 'graphql';

class ReviewRepository {
  async createReview(reviewData) {
    let session;
    let driver;
    try {
      driver = await connect();
      session = driver.session();
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
      console.error('Error creating review:', error);
      throw new GraphQLError(`Failed to create review: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    } finally {
      if (session) session.close();
      if (driver) driver.close();
    }
  }

  async getAverageRating({ targetType, listingId = null, hostId = null }) {
    let session;
    let driver;
    try {
      driver = await connect();
      session = driver.session();

      const filters = [];
      if (listingId) filters.push(`r.listingId = $listingId`);
      if (hostId) filters.push(`r.hostId = $hostId`);
      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

      const query = `
        MATCH (r:Review {targetType: $targetType})
        ${whereClause}
        RETURN avg(r.rating) AS averageRating
      `;

      const result = await session.run(query, { targetType, listingId, hostId });
      return result.records[0]?.get('averageRating') || 0;
    } catch (error) {
      console.error('Error fetching average rating:', error);
      throw new GraphQLError(`Failed to get average rating: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    } finally {
      if (session) session.close();
      if (driver) driver.close();
    }
  }

  async searchReviews(criteria) {
    let session;
    let driver;
    try {
      driver = await connect();
      session = driver.session();

      const filters = [];
      if (criteria.targetType) filters.push(`r.targetType = $targetType`);
      if (criteria.listingId) filters.push(`r.listingId = $listingId`);
      if (criteria.hostId) filters.push(`r.hostId = $hostId`);
      if (criteria.minRating) filters.push(`r.rating >= $minRating`);
      if (criteria.maxRating) filters.push(`r.rating <= $maxRating`);

      const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

      const query = `
        MATCH (r:Review)
        ${whereClause}
        RETURN r
      `;

      const result = await session.run(query, criteria);
      return result.records.map(record => record.get('r').properties);
    } catch (error) {
      console.error('Error searching reviews:', error);
      throw new GraphQLError(`Failed to search reviews: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    } finally {
      if (session) session.close();
      if (driver) driver.close();
    }
  }

  async getReviews({ targetType, listingId = null, hostId = null }) {
    return this.searchReviews({ targetType, listingId, hostId });
  }

  async getReview({ targetType, bookingId }) {
    let session;
    let driver;
    try {
      driver = await connect();
      session = driver.session();
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
      console.error('Error fetching review:', error);
      throw new GraphQLError(`Failed to get review: ${error.message}`, {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    } finally {
      if (session) session.close();
      if (driver) driver.close();
    }
  }
}

export default ReviewRepository;
