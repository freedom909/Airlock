import UserRepository from '../repositories/userRepository.js'
// import AccountRepository from '../repositories/accountRepository.js';
import UserService from './userService.js';
// import BookingService from './bookingService.js';
// import AccountService from './accountService.js';
// import ListingService from './listingService.js';
import pkg from 'mongodb';
const { MongoClient } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let client;

async function initializeServices() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('MongoDB connected');

    const db = client.db(dbName);
    console.log('DB object:', db);

    if (!db) {
      throw new Error('Failed to connect to the database');
    }

    const userRepository = new UserRepository(db);
    // const accountRepository = new AccountRepository(db);
    const userService = new UserService(userRepository);
    // const accountService= new AccountService(accountRepository);
    // const bookingService= new BookingService(bookingRepository);
    // const listingService= new ListingService(listingRepository);


    return { userService };
  } catch (error) {
    console.error('Error initializing services:', error);
    throw new Error('Failed to initialize services');
  }
}

export default initializeServices;