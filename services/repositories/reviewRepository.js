import Review from '../models/review.js'; // Assuming you have a Review model defined

class ReviewRepository {
  async createReview(reviewData) {
    return await Review.create(reviewData);
  }

  async searchReviews(query, filters) {
    const searchParams = {
      index: 'reviews',
      body: {
        query: query,
        ...filters // Add any pagination or sorting filters here
      }
    };

    try {
      const response = await elasticsearchClient.search(searchParams);
      return response.hits.hits.map(hit => hit._source); // Map the Elasticsearch hits to the review data
    } catch (error) {
      throw new Error(`Elasticsearch search failed: ${error.message}`);
    }
  }

  async getAverageRating({ targetType, listingId = null, hostId = null }) {
    const where = { targetType };
    if (listingId) where.listingId = listingId;
    if (hostId) where.hostId = hostId;
    const reviews = await Review.findAll({ where });
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    return reviews.length ? totalRating / reviews.length : 0;
  }

  async getReviews({ targetType, listingId = null, hostId = null }) {
    const where = { targetType };
    if (listingId) where.listingId = listingId;
    if (hostId) where.hostId = hostId;
    return await Review.findAll({ where });
  }

  async getReview({ targetType, bookingId }) {
    return await Review.findOne({ where: { targetType, bookingId } });
  }

  async getUser(userId) {
    return await Review.findOne({ where: { userId } });
  }
  async getListing(listingId) {
    return await Review.findOne({ where: { listingId } });
  }
}

export default ReviewRepository;
