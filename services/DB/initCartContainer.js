import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import ListingService from '../services/listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../services/userService.js';
import UserRepository from '../repositories/userRepository.js';
import BookingService from '../services/bookingService.js';
import BookingRepository from '../repositories/bookingRepository.js';
import CartService from '../services/cartService.js';
import CartRepository from '../repositories/cartRepository.js';
import PaymentService from '../services/paymentService.js';
import PaymentRepository from '../repositories/paymentRepository.js';

const initializeCartContainer = async ({ services = [] } = {}) => {
  let mysqldb;
  let mongodb;

  try {
    // Establish connection to MySQL database
    mysqldb = await connectMysql();
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    throw error;
  }

  try {
    // Establish connection to MongoDB database
    mongodb = await connectToMongoDB();
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MongoDB database:', error);
    throw error;
  }

  // Initialize the container and register dependencies and services
  const baseContainer = createContainer();
  baseContainer.register({
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    bookingRepository: asClass(BookingRepository).singleton(),
    bookingService: asClass(BookingService).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),
    listingService: asClass(ListingService).singleton(),
  });
  
  const cartContainer = baseContainer.createScope();
  cartContainer.register({
    cartRepository: asClass(CartRepository).singleton(),
    cartService: asClass(CartService).singleton(),
    paymentRepository: asClass(PaymentRepository).singleton(),
    paymentService: asClass(PaymentService).singleton(),
  });
  

  // Register services dynamically
  services.forEach(service => {
    cartContainer.register({
      [service.name]: asClass(service).singleton(),
    });
  });

  console.log('Container initialized with registered services');
  return cartContainer;
};

export default initializeCartContainer;
