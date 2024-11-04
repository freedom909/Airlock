// initializeAmenityContainer.js
import { createContainer, asValue, asClass } from 'awilix';
import dbconfig from './dbconfig.js';
import ListingService from '../services/listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../services/userService.js';
import UserRepository from '../repositories/userRepository.js';
import AmenityService from '../services/amenityService.js';
import ReviewService from '../services/reviewService.js';
import ReviewRepository from '../repositories/reviewRepository.js';
import BookingService from '../services/bookingService.js';
import BookingRepository from '../repositories/bookingRepository.js';


import axios from 'axios';

const initializeReviewContainer = async () => {
  const mysqldb = await dbconfig.mysql();
  const mongodb = await dbconfig.mongo();

  const container = createContainer();
  container.register({
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),
    listingService: asClass(ListingService).singleton(),
    amenityService: asClass(AmenityService).singleton(),
    amenityRepository: asClass(AmenityRepository).singleton(),
    reviewService: asClass(ReviewService).singleton(),
    reviewRepository: asClass(ReviewRepository).singleton(),
    bookingService: asClass(BookingService).singleton(),
    bookingRepository: asClass(BookingRepository).singleton(),
    // Add other dependencies here...

    axios: asValue(axios),
    // Add other dependencies here...
  });

  console.log('Database connected');
  return container;
};

export default initializeReviewContainer;
