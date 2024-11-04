import { RESTDataSource } from '@apollo/datasource-rest'; // Make sure the import is correct

class PaymentRepository extends RESTDataSource {

    constructor({ bookingRepository, paymentRepository, cartRepository }) {
        super();
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.cartRepository = cartRepository;
        this.baseURL = 'http://localhost:4004/api/v1/payments/';
    }

    async createPayment(payment) {
        return await this.post('', payment);
    }

    async getPayment(paymentId) {
        return await this.get(`${paymentId}`);
    }

    async updatePayment(paymentId, payment) {
        return await this.put(`${paymentId}`, payment);
    }

    async deletePayment(paymentId) {
        return await this.delete(`${paymentId}`);
    }

    async getPaymentForBooking(bookingId) {
        const booking = await this.bookingRepository.getBooking(bookingId);
        if (!booking) {
            throw new Error(`Booking not found: ${bookingId}`);
        }
        const listing = await this.listingRepository.getListing(booking.listingId);
        if (!listing) {
            throw new Error(`Listing not found: ${booking.listingId}`);
        }
        const cart = await this.cartRepository.getCartForListing(listing.id);
        if (!cart) {
            throw new Error(`Cart not found for listing: ${listing.id}`);
        }
        const payment = await this.paymentRepository.getPayment(cart.paymentId);
        if (!payment) {
            throw new Error(`Payment not found for cart: ${cart.id}`);
        }
        return payment;
    }

    async getPaymentForListing(listingId) {
        const listing = await this.listingRepository.getListing(listingId);
        if (!listing) {
            throw new Error(`Listing not found: ${listingId}`);
        }
        const cart = await this.cartRepository.getCartForListing(listing.id);
        if (!cart) {
            throw new Error(`Cart not found for listing: ${listing.id}`);
        }
        const payment = await this.paymentRepository.getPayment(cart.paymentId);
        if (!payment) {
            throw new Error(`Payment not found for cart: ${cart.id}`);
        }
        return payment;
    }

    async getPaymentForUser(userId) {
        const bookings = await this.bookingRepository.getBookingsForUser(userId);
        const payments = [];
        for (const booking of bookings) {
            const payment = await this.getPaymentForBooking(booking.id);
            payments.push(payment);
        }
        return payments;
    }

    async getPaymentForListingAndUser(listingId, userId) {
        const listing = await this.listingRepository.getListing(listingId);
        if (!listing) {
            throw new Error(`Listing not found: ${listingId}`);
        }
        const cart = await this.cartRepository.getCartForListing(listing.id);
        if (!cart) {
            throw new Error(`Cart not found for listing: ${listing.id}`);
        }
        const payment = await this.paymentRepository.getPayment(cart.paymentId);
        if (!payment) {
            throw new Error(`Payment not found for cart: ${cart.id}`);
        }
        if (payment.userId !== userId) {
            throw new Error('Payment does not belong to the user');
        }
        return payment;
    }

    async addFundsToUserWallet(userId, amount) {
        // Implement database update to add funds to user's wallet
        try {
          const user = await this.db.User.findOne({ where: { id: userId } });
          if (!user) {
            throw new Error('User not found');
          }
          user.funds += amount;
          await user.save();
          return user.funds;
        } catch (error) {
          console.error('Error adding funds to wallet:', error);
          throw new Error('Error adding funds to wallet');
        }
      }
    async subtractFundsFromUserWallet(userId, amount) {
        // Implement database update to subtract funds from user's wallet
        try {
          const user = await this.db.User.findOne({ where: { id: userId } });
          if (!user) {
            throw new Error('User not found');
          }
          user.funds -= amount;
          await user.save();
          return user.funds;
        } catch (error) {
          console.error('Error subtracting funds from wallet:', error);
          throw new Error('Error subtracting funds from wallet');
        }
      }
}

export default PaymentRepository;
