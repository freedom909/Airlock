import { GraphQLError } from 'graphql';
import { RESTDataSource } from '@apollo/datasource-rest';

class CartService extends RESTDataSource {
  constructor({ bookingRepository, paymentRepository, listingRepository, cartRepository, userRepository }) {
    super();
    this.bookingRepository = bookingRepository;
    this.paymentRepository = paymentRepository;
    this.listingRepository = listingRepository;
    this.cartRepository = cartRepository;
    this.userRepository = userRepository;
    this.baseURL = 'http://localhost:4060/';
  }

  async createBooking({ guestId, listingId }) {
    if (!guestId || !listingId) {
      throw new GraphQLError('Missing required parameters', { extensions: { code: 'INVALID_INPUT' } });
    }
    try {
      const listing = await this.listingRepository.findById(listingId);
      if (!listing) {
        throw new GraphQLError('Listing not found', { extensions: { code: 'LISTING_NOT_FOUND' } });
      }
      const user = await this.userRepository.findById(guestId);
      if (!user) {
        throw new GraphQLError('User not found', { extensions: { code: 'USER_NOT_FOUND' } });
      }
      const booking = await this.bookingRepository.createBooking({ guestId, listingId });
      return booking;
    } catch (error) {
      throw new GraphQLError('Failed to create booking', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getBookingsForUser(user) {
    try {
      return await this.cartRepository.find({ where: { guestId: user.id } });
    } catch (error) {
      throw new GraphQLError('Failed to fetch bookings', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getBookingsByUserId(userId) {
    try {
      return await this.cartRepository.find({ where: { guestId: userId } });
    } catch (error) {
      throw new GraphQLError('Failed to fetch bookings', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getBookingById(id) {
    try {
      return await this.bookingRepository.findById(id);
    } catch (error) {
      throw new GraphQLError('Failed to fetch booking', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async confirmBooking(id) {
    try {
      const booking = await this.bookingRepository.findById(id);
      if (!booking) {
        throw new GraphQLError('Booking not found', { extensions: { code: 'BOOKING_NOT_FOUND' } });
      }
      booking.status = 'CONFIRMED';
      await booking.save();
      return booking;
    } catch (error) {
      throw new GraphQLError('Failed to confirm booking', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async cancelBooking(id) {
    try {
      const booking = await this.bookingRepository.findById(id);
      if (!booking) {
        throw new GraphQLError('Booking not found', { extensions: { code: 'BOOKING_NOT_FOUND' } });
      }
      booking.status = 'CANCELLED';
      await booking.save();
      return booking;
    } catch (error) {
      throw new GraphQLError('Failed to cancel booking', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async makePayment(bookingId, paymentData) {
    if (!bookingId || !paymentData) {
      throw new GraphQLError('Missing required parameters', { extensions: { code: 'INVALID_INPUT' } });
    }
    try {
      const booking = await this.bookingRepository.findById(bookingId);
      if (!booking) {
        throw new GraphQLError('Booking not found', { extensions: { code: 'BOOKING_NOT_FOUND' } });
      }
      const payment = await this.paymentRepository.create({ bookingId, ...paymentData });
      return payment;
    } catch (error) {
      throw new GraphQLError('Failed to make payment', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getPaymentByBookingId(bookingId) {
    try {
      return await this.paymentRepository.findOne({ where: { bookingId } });
    } catch (error) {
      throw new GraphQLError('Failed to fetch payment', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }
}

export default CartService;
