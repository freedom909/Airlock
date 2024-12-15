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

import Listing from '../models/listing.js';
import Booking from '../models/booking.js';

const initializeAiContainer = async () => {
    try {
        // Connect to MongoDB
        await connectToMongoDB();

        // Create a new DI container
        const container = createContainer();

        // Register repositories, services, and models
        container.register({
            userRepository: asClass(UserRepository).singleton(),
            secretKey: asValue(process.env.JWT_SECRET || 'good'),
            expiresIn: asValue('1h'),
            localAuthService: asClass(LocalAuthService).singleton(),
            oAuthService: asClass(OAuthService).singleton(),
            tokenService: asClass(TokenService).singleton(),

            aiService: asClass(AiService).singleton(),

            listingRepository: asClass(ListingRepository).singleton(),
            listingService: asClass(ListingService).singleton(),

            // Other dependencies or configurations can be added here
        });

        return container;
    } catch (error) {
        console.error('Failed to initialize AI service container:', error);
        process.exit(1);
    }
};

export default initializeAiContainer;
