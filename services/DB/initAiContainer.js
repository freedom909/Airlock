import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import ListingService from '../listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserRepository from '../repositories/userRepository.js';
import LocalAuthService from '../userService/localAuthService.js';
import OAuthService from '../userService/oauthService.js';
import TokenService from '../userService/tokenService.js';

import LocationRepository from '../repositories/locationRepository.js';
import LocationService from '../locationService.js';
import BookingRepository from '../repositories/bookingRepository.js';
import BookingService from '../bookingService.js';
import AiService from '../aiService.js';
import User from '../models/user.js';
import sequelize from '../models/seq.js';
import Listing from '../models/listing.js';
import Booking from '../models/booking.js';

const initializeAiContainer = async ({ services = [] } = {}) => {
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
        bookingRepository: asClass(BookingRepository).singleton(),
        bookingService: asClass(BookingService).singleton(),
        aiService: asClass(AiService).singleton(),
    });


    // Register services dynamically
    services.forEach(service => {
        container.register({
            [service.name]: asClass(service).singleton(),
        });
    });

    console.log('Database connected');
    return container;
};
export default initializeAiContainer;
