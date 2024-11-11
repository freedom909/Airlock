import { RESTDataSource } from "@apollo/datasource-rest";
class PaymentService extends RESTDataSource {
  constructor(paymentRepository) {
    super();
    this.paymentRepository = paymentRepository;
    this.baseURL = "https://rt-airlock-services-payments.herokuapp.com/";
  }

  async getPaymentInfo(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch payment information');
    }
    // Fetch payment information from the payment repository
    const paymentInfo = await this.paymentRepository.getPaymentInfo(userId);
    return paymentInfo || 0; // Example return value if no specific info is found
  }

  async addFunds({ userId, amount }) {
    if (!userId) {
      throw new Error('User ID is required to add funds');
    }
    try {
      const updatedFunds = await this.paymentRepository.addFundsToUserWallet(userId, amount);
      if (!updatedFunds) {
        throw new Error('Failed to add funds');
      }
      return updatedFunds;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw new Error('Error adding funds');
    }
  }

  async subtractFunds({ userId, amount }) {
    if (!userId) {
      throw new Error('User ID is required to subtract funds');
    }
    try {
      const updatedFunds = await this.paymentRepository.addFundsToUserWallet(userId, amount);
      if (!updatedFunds) {
        throw new Error('Failed to add funds');
      }
      return updatedFunds;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw new Error('Error adding funds');
    }

  }




}

export default PaymentService;
