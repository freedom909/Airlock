import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import ListingService from '../listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../userService.js';
import UserRepository from '../repositories/userRepository.js';
import sequelize from '../models/seq.js';  // Import your Sequelize instance
import LocationRepository from '../repositories/locationRepository.js';
import LocationService from '../locationService.js';

const initializeLocationContainer = async ({ services = [] } = {}) => {
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
        userService: asClass(UserService).singleton(),
        listingService: asClass(ListingService).singleton(),
        locationRepository: asClass(LocationRepository).singleton(),  // Lowercased for consistency
        locationService: asClass(LocationService).singleton(),  // Fixed singleton method call
    });

    // Register services dynamically, check if it's a class or value
    services.forEach(service => {
        const serviceType = typeof service === 'function' && /^\s*class\s+/.test(service.toString())
            ? asClass(service).singleton()
            : asValue(service);  // Use asValue if it's not a class
        container.register({
            [service.name]: serviceType,
        });
    });

    console.log('Database connected');
    return container;
};

export default initializeLocationContainer;
