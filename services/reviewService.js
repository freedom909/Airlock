import ReviewRepository from "./repositories/reviewRepository.js";
import getUserFromDb from "./repositories/userRepository.js";

class ReviewService {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  async createReviewForListing({ listingId, authorId, bookingId, ...reviewInput }) {
    if (!listingId || !authorId || !bookingId) {
      throw new Error('Invalid input parameters');
    }
    return await this.reviewRepository.createReview({
      ...reviewInput,
      listingId,
      authorId,
      bookingId,
      targetType: 'LISTING',
    });
  }

  async createReviewForHost({ hostId, authorId, bookingId, ...reviewInput }) {
    if (!hostId || !authorId || !bookingId) {
      throw new Error('Invalid input parameters');
    }
    return await this.reviewRepository.createReview({
      ...reviewInput,
      hostId,
      authorId,
      bookingId,
      targetType: 'HOST',
    });
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
}

export default ReviewService;