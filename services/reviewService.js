import ReviewRepository from "../repositories/reviewRepository.js";
class ReviewService {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  async postReview({ guestId, authorId, bookingId, ...reviewInput }) {
    return await this.reviewRepository.createReview({
      ...reviewInput,
      guestId,
      authorId,
      bookingId,
      targetType: 'GUEST',
    });
  }

  async createReviewForListing({ listingId, authorId, bookingId, ...reviewInput }) {
    return await this.reviewRepository.createReview({
      ...reviewInput,
      listingId,
      authorId,
      bookingId,
      targetType: 'LISTING',
    });
  }


  async createReviewForHost({ hostId, authorId, bookingId, ...reviewInput }) {
    return await this.reviewRepository.createReview({
      ...reviewInput,
      hostId,
      authorId,
      bookingId,
      targetType: 'HOST',
    });
  }

  async searchReviews({ guestId, authorId, listingId, hostId, targetType, comment, ...filters }) {
    // Build the search query
    const query = {
      bool: {
        must: [
          { match: { guestId } },
          { match: { authorId } },
          { match: { listingId } },
          { match: { hostId } },
          { match: { targetType } }
        ],
        // Add a full-text search for the comment field if the user wants to search by comment
        ...(comment ? { should: [{ match: { comment } }] } : {})
      }
    };

    // Perform the search using the review repository (which interacts with Elasticsearch)
    return await this.reviewRepository.searchReviews(query, filters);
  }

  async getOverallRatingForListing(listingId) {
    return await this.reviewRepository.getAverageRating({ targetType: 'LISTING', listingId });
  }

  async getReviewsForListing(listingId) {
    return await this.reviewRepository.getReviews({ targetType: 'LISTING', listingId });
  }

  async getReviewForBooking(targetType, bookingId) {
    return await this.reviewRepository.getReview({ targetType, bookingId });
  }

  async getOverallRatingForHost(hostId) {
    return await this.reviewRepository.getAverageRating({ targetType: 'HOST', hostId });
  }

  async getUser(userId) {
    return await this.reviewRepository.getUser(userId);
  }

  async getOverallRatingForListing(id) {
    return await this.reviewRepository.getAverageRating({ targetType: 'LISTING', listingId: id });
  }

  async getListing(listingId) {
    return await this.reviewRepository.getListing(listingId);
  }
}

export default ReviewService;
