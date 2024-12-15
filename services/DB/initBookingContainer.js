import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import cacheClient from '../../cache/cacheClient.js'; // Import your cache client
import ListingService from '../listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../userService/index.js';
import UserRepository from '../repositories/userRepository.js';
import BookingService from '../bookingService.js';
import BookingRepository from '../repositories/bookingRepository.js';
import LocationService from '../locationService.js';
import LocationRepository from '../repositories/locationRepository.js';
import index from '../userService/index.js';
import LocalAuthService from '../userService/localAuthService.js';
import OAuthService from '../userService/oauthService.js';
import TokenService from '../userService/tokenService.js';
import sequelize from '../models/seq.js';

const initializeBookingContainer = async ({ services = [] } = {}) => {
  // Establishing connection to MySQL database
  const mysqldb = await connectMysql();

  // Establishing connection to MongoDB database
  const mongodb = await connectToMongoDB();

  // Initializing the container and registering dependencies and services
  const container = createContainer();


  container.register({
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    sequelize: asValue(sequelize),
    userRepository: asClass(UserRepository).singleton(),
    localAuthService: asClass(LocalAuthService).singleton(),
    oAuthService: asClass(OAuthService).singleton(),
    tokenService: asClass(TokenService).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),
    listingService: asClass(ListingService).singleton(),
    locationRepository: asClass(LocationRepository).singleton(),
    locationService: asClass(LocationService).singleton(),
  });


  // Register services dynamically
  services.forEach(service => {
    container.register({
      [service.name]: asClass(service).singleton(),
    });
  });

  console.log('Container initialized with registered services');
  return container;
};

export default initializeBookingContainer;