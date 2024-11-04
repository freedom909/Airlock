import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import cacheClient from '../../cache/cacheClient.js'; // Import your cache client
import ListingService from '../services/listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../services/userService.js';
import UserRepository from '../repositories/userRepository.js';
import BookingService from '../services/bookingService.js';
import BookingRepository from '../repositories/bookingRepository.js';


const initializeBookingContainer = async ({ services = [] } = {}) => {
  let mysqldb;
  let mongodb;

  try {
    mysqldb = await connectMysql();
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    throw error;
  }

  try {
    mongodb = await connectToMongoDB();
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MongoDB database:', error);
    throw error;
  }

  const container = createContainer();
  container.register({
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    cacheClient: asValue(cacheClient),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),
    listingService: asClass(ListingService).singleton(),
    bookingRepository: asValue(BookingRepository),  // Register the Listing model here
    bookingService: asValue(BookingService),     // Reusing Listing model for the service
  });

  services.forEach(service => {
    container.register({
      [service.name]: asClass(service).singleton(),
    });
  });

  console.log('Container initialized with registered services');
  return container;
};

export default initializeBookingContainer;