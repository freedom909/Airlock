import dotenv from 'dotenv';
dotenv.config();
import { hashPassword, checkPassword } from '../../infrastructure/helpers/passwords.js';
import BaseRepository from './baseRepository.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { MongoClient, ObjectId } from 'mongodb';
import EmailVerification from '../../infrastructure/email/emailVerification.js';


class UserRepository extends BaseRepository {
  constructor({ mongodb }) {
    super();
    this.model = User; // Set the model to the imported User model
    this.collection = mongodb.collection('users');
    this.emailVerification = new EmailVerification();
  }

  async findOne(query) {
    try {
      console.log('query:', query);
      return await this.collection.findOne(query);
    } catch (error) {
      console.error('Error during findOne:', error);
      throw error;
    }
  }

  async findByIdAndUpdate(id, update) {
    try {
      return await this.collection.findOneAndUpdate(
        { _id: new ObjectId() },
        { $set: update },
        { returnDocument: 'after' }
      );
    } catch (error) {
      console.error('Error during findByIdAndUpdate:', error);
      throw error;
    }
  }

  async save(user) {
    try {
      const result = await this.collection.insertOne(user);
      if (!result.insertedId) {
        throw new Error('Failed to insert user');
      }
      return { ...user, _id: result.insertedId };
    } catch (error) {
      console.error('Error during save:', error);
      throw error;
    }
  }

  async findByIdAndDelete(id) {
    try {
      return await this.collection.findOneAndDelete({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error during findByIdAndDelete:', error);
      throw error;
    }
  }

  async getUserByNicknameFromDb(nickname) {
    try {
      return await this.collection.findOne({ nickname });
    } catch (error) {
      console.error('Error during getUserByNicknameFromDb:', error);
      throw error;
    }
  }

  async getUserFromDb(id) {
    try {
      const query = { _id: new ObjectId(id) };
      return await this.collection.findOne(query);
    } catch (error) {
      console.error('Error during getUserFromDb:', error);
      throw error;
    }
  }

  async getUserByEmailFromDb(email) {
    try {
      return await this.collection.findOne({ email });
    } catch (error) {
      console.error('Error during getUserByEmailFromDb:', error);
      throw error;
    }
  }

  async checkPassword(password, hashedPassword) {
    return await checkPassword(password, hashedPassword);
  }

  async hashPassword(password) {
    return await hashPassword(password);
  }

  async generateToken(payload) {
    console.log('Payload received for token generation:', payload);

    const jwtSecret = process.env.JWT_SECRET || 'good';

    if (!payload || !payload._id) {
      throw new Error('Invalid payload: _id is required to generate a token');
    }

    return sign(payload, jwtSecret, {
      algorithm: 'HS256',
      subject: payload._id.toString(),
      expiresIn: '1h',
    });
  }

  async sendVerificationEmail(email, token) {
    await this.emailVerification.sendVerificationEmail(email, token);
  }

  async findById(id) {
    try {
      const query = { _id: new ObjectId() };
      return await this.collection.findOne(query);
    } catch (error) {
      console.error('Error during findById:', error);
      throw error;
    }
  }

  async updatePassword(id, hashedPassword) {
    try {
      return await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { password: hashedPassword } }
      );
    } catch (error) {
      console.error('Error during updatePassword:', error);
      throw error;
    }
  }

  async insertUser(userData, hashedPassword) {
    try {
      const id = new ObjectId(); // Generate a new ObjectId if `id` is not provided
      return await this.collection.insertOne({ _id: id, ...userData, password: hashedPassword });
    } catch (error) {
      console.error('Error during insertOne:', error);
      throw error;
    }
  }
}

export default UserRepository;