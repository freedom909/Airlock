import { hashPassword, checkPassword } from '../../infrastructure/helpers/passwords.js';
import BaseRepository from './baseRepository.js';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import pkg1 from 'mongodb';
const { MongoClient, ObjectId } = pkg1;
import EmailVerification from '../../infrastructure/email/emailVerification.js';
import dotenv from 'dotenv';
dotenv.config();

class UserRepository extends BaseRepository {
  constructor({ mongodb }) {
    super();
    this.collection = mongodb.collection('users');
    this.emailVerification = new EmailVerification();
  }

  // Method to find a user by their provider and email
  async findUserByProvider({ email, provider }) {
    try {
      return await this.collection.findOne({ email, provider });
    } catch (e) {
      console.error('Error during findUserByProvider:', e);
      throw e;
    }
  }

  // Method to find a user by ID
  async findById(id) {
    const query = { _id: ObjectId.createFromHexString(id) };
    return await this.collection.findOne(query);
  }

  // Method to insert a new user
  async insertUser(user) {
    const result = await this.collection.insertOne(user);
    if (!result.insertedId) {
      throw new Error('Failed to insert user');
    }
    return { ...user, _id: result.insertedId };
  }

  // Method to update a user's password
  async updatePassword(id, hashedPassword) {
    return await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: hashedPassword } }
    );
  }

  // Method to get a user by their email from the database
  async getUserByEmailFromDb(email) {
    try {
      return await this.collection.findOne({ email });
    } catch (error) {
      console.error('Error during findOne:', error);
      throw error;
    }
  }

  // Method to check a password
  async checkPassword(password, hashedPassword) {
    return await checkPassword(password, hashedPassword);
  }

  // Method to hash a password
  async hashPassword(password) {
    return await hashPassword(password);
  }

  // Token generation
  async generateToken(user) {
    return sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  // Email verification
  async sendVerificationEmail(email, token) {
    await this.emailVerification.sendVerificationEmail(email, token);
  }
}

export default UserRepository;
