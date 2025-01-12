// initializeAmenityContainer.js
import { createContainer, asValue, asClass } from 'awilix';
import dbConfig from './dbConfig.js';
import ListingService from '../listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import LocalAuthService from '../userService/localAuthService.js';
import OAuthService from '../userService/oauthService.js';
import TokenService from '../userService/tokenService.js';
import UserRepository from '../repositories/userRepository.js';
import AmenityService from '../amenityService.js';
import ReviewService from '../reviewService.js';
import ReviewRepository from '../repositories/reviewRepository.js';
import BookingService from '../bookingService.js';
import BookingRepository from '../repositories/bookingRepository.js';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import connect from './connectNeo4jDB.js'; // Import your Neo4j database connection function
import sequelize from '../models/seq.js'
import axios from 'axios';

const initializeReviewContainer = async () => {
  // Establishing connection to MySQL database
  const mysqldb = await connectMysql();

  // Establishing connection to MongoDB database
  const mongodb = await connectToMongoDB();


  // Initializing the container and registering dependencies and services
  const neo4jdb = await connect() // how to create the function connect()

  const container = createContainer();
  container.register({
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    neo4jdb: asValue(neo4jdb),
    sequelize: asValue(sequelize),
    userRepository: asClass(UserRepository).singleton(),
    secretKey: asValue(process.env.JWT_SECRET || 'good'),
    expiresIn: asValue('1h'),
    localAuthService: asClass(LocalAuthService).singleton(),
    oAuthService: asClass(OAuthService).singleton(),
    tokenService: asClass(TokenService).singleton(),
    userRepository: asClass(UserRepository).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),
    listingService: asClass(ListingService).singleton(),
    bookingService: asClass(BookingService).singleton(),
    bookingRepository: asClass(BookingRepository).singleton(),
    reviewService: asClass(ReviewService).singleton(),
    reviewRepository: asClass(ReviewRepository).singleton(),
    // Add other dependencies here...

    axios: asValue(axios),
    // Add other dependencies here...
  });

  console.log('Database connected');
  return container;
};

export default initializeReviewContainer;
