import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import ListingService from '../listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../userService.js';
import UserRepository from '../repositories/userRepository.js';
import User from '../models/user.js';
import LocationRepository from '../repositories/locationRepository.js';
import LocationService from '../locationService.js';
import BookingRepository from '../repositories/bookingRepository.js';
import BookingService from '../bookingService.js';
import SupportService from '../supportService.js';



const initializeSupportContainer = async () => {
    try {
        await connectToMongoDB(); // Ensure the DB connection is active  

        const container = createContainer();

        container.register({
            userRepository: asClass(UserRepository).singleton(),
            userService: asClass(UserService).singleton(),
            UserModel: asValue(User), // Pass the User model to the repository  
            // Other registrations...  
        });

        return container;
    } catch (error) {
        console.error('Failed to initialize support container:', error);
        process.exit(1);
    }
};

export default initializeSupportContainer;
