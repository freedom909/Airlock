import { hashPassword } from '../helpers/passwords.js';
import { GraphQLError } from 'graphql';
import { ForbiddenError } from '../utils/errors.js';

class AccountService {
  constructor({ accountRepository, listingRepository, cartRepository }) {
    this.accountRepository = accountRepository;
    this.listingRepository = listingRepository;
    this.cartRepository = cartRepository;
  }

  async getUser(id) {
    const user = await this.accountRepository.getAccountById(id);
    if (!user) {
      throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
    }
    return user;
  }

  async getBookingsForUser(user) {
    if (!user) {
      throw new GraphQLError('No user found', { extensions: { code: 'NOT_FOUND' } });
    }
    return await this.cartRepository.getBookingsForUser(user.id);
  }

  async createAccount({ email, password, name, nickname, role, picture }) {
    const existingUser = await this.accountRepository.findOne({ nickname });
    if (existingUser) {
      throw new ForbiddenError('Nickname is already in use, please use another one', 'BAD_USER_INPUT');
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      email,
      name,
      password: passwordHash,
      nickname,
      role,
      picture,
      createdAt: new Date(),
    };

    try {
      return await this.accountRepository.save(newUser);
    } catch (e) {
      console.error('Registration error:', e);
      throw new GraphQLError('Email is already in use or an internal server error occurred', { extensions: { code: 'SERVER_ERROR' } });
    }
  }

  async getBookingById(id) {
    try {
      return await this.cartRepository.findById(id);
    } catch (error) {
      throw new GraphQLError('Failed to fetch booking', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getListingsForHost(hostId) {
    try {
      return await this.listingRepository.getListingsForHost(hostId);
    } catch (error) {
      throw new GraphQLError('Failed to fetch listings', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
    }
  }

  async getAccountById(id) {
    return await this.accountRepository.getAccountById(id);
  }

  async getAllAccounts() {
    return await this.accountRepository.getAllAccounts();
  }

  async createListing({ title, description, photoThumbnail, numOfBeds, costPerNight, locationType, amenities, hostId }) {
    if (!title || !description || !photoThumbnail || !numOfBeds || !costPerNight || !locationType || !amenities || !hostId) {
      throw new Error("All listing details must be provided");
    }

    const user = await this.accountRepository.getAccountById(hostId);
    if (!user || user.role !== 'HOST') {
      throw new Error("Only hosts can create listings");
    }

    return await this.listingRepository.createListing({
      title,
      description,
      photoThumbnail,
      numOfBeds,
      costPerNight,
      locationType,
      amenities,
      hostId
    });
  }

  async deleteAccount(id) {
    return await this.accountRepository.deleteAccount(id);
  }

  async updateAccountEmail(id, email) {
    return await this.accountRepository.updateAccountEmail(id, email);
  }

  async updateAccountPassword(id, password) {
    const passwordHash = await hashPassword(password);
    return await this.accountRepository.updateAccountPassword(id, passwordHash);
  }

  async updateAccountRole(id, role) {
    return await this.accountRepository.updateAccountRole(id, role);
  }

  async updateAccountPicture(id, picture) {
    return await this.accountRepository.updateAccountPicture(id, picture);
  }

  async updateAccountProfile(id, bio) {
    return await this.accountRepository.updateAccountProfile(id, bio);
  }

  async createUser({ name, email, password }) {
    const passwordHash = await hashPassword(password);
    const user = {
      name,
      email,
      password: passwordHash,
      createdAt: new Date(),
    };
    return await this.accountRepository.createUser(user);
  }

  async deleteUser(id) {
    return await this.accountRepository.deleteUser(id);
  }

  async updateUserEmail(id, email) {
    return await this.accountRepository.updateUserEmail(id, email);
  }

  async updateUserPassword(id, password) {
    const passwordHash = await hashPassword(password);
    return await this.accountRepository.updateUserPassword(id, passwordHash);
  }

  async updateUser({ userId, userInfo }) {
    return await this.accountRepository.updateUser(userId, userInfo);
  }
}

export default AccountService;




