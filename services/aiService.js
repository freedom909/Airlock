import { RESTDataSource } from '@apollo/datasource-rest';
import UserRepository from './repositories/userRepository.js';
import User from './models/user.js'; // Adjust the path according to your new structure
import { hashPassword, checkPassword } from '../infrastructure/helpers/passwords.js'; // Adjust the path accordingly
import { GraphQLError, doTypesOverlap } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';//Error during login: TypeError: Cannot read properties of undefined (reading 'sign')
import { loginValidate } from '../infrastructure/helpers/loginValidator.js';
import pkg from 'mongodb';
import MailToUser from '../infrastructure/email/mailTo.js';
const { MongoClient, ObjectId } = pkg;
import dotenv from 'dotenv';
import Message from './models/support.js';
import Listing from './models/listing.js';
dotenv.config();
// Adjust the path accordingly

/**
 * Saves a chat message and reply to MongoDB
 * @param {string} message - The user's message.
 * @param {string} reply - The ChatGPT's response.
 * @returns {Promise<Object>} The saved message document.
 */
class SupportService extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = "http://localhost:4000/";
        // this.supportRepository = supportRepository;
        this.mailToUser = new MailToUser();
    }

    async savedMessageToDB({ message, reply }) {
        console.log('Attempting to save message:', { message, reply });
        try {
            const savedMessage = await Message.create({ message, reply });
            console.log('Message saved:', savedMessage);
            return savedMessage;
        } catch (error) {
            console.error('Error saving message:', error.message);
            console.error(error.stack); // Log the full stack trace for debugging  
            throw new Error('Error saving message to the database');
        }
    }

    async getListingInfo(listingId) {
        console.log('Fetching listing info for listingId:', listingId);
        if (!listingId) {
            throw new Error('listingId is required');
        }
        try {
            const listingData = await Listing.findById(listingId).exec();
            if (!listingData) {
                throw new Error(`Listing not found: ${listingId}`);
            }
            console.log('Listing data retrieved:', listingData);
            return listingData;
        } catch (e) {
            console.error('Error fetching listing data:', e.message);
            console.error(e.stack); // Log the full stack trace for debugging  
            throw new Error('Error fetching listing data');
        }
    }
}

export default SupportService;