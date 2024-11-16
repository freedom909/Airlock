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
    // Initialize database connections
    const [mysqldb, mongodb] = await Promise.all([
        connectMysql(),
        connectToMongoDB()
    ]);

    // Create the container and register core dependencies and services
    const container = createContainer();
    container.register({
        mysqldb: asValue(mysqldb),
        mongodb: asValue(mongodb),
        sequelize: asValue(sequelize),
        userRepository: asClass(UserRepository).singleton(),
        userService: asClass(UserService).singleton(),
        listingRepository: asClass(ListingRepository).singleton(),
        listingService: asClass(ListingService).singleton(),
        locationRepository: asClass(LocationRepository).singleton(),
        locationService: asClass(LocationService).singleton(),
    });

    // Dynamically register additional services
    services.forEach((service) => {
        const isClass = typeof service === 'function' && /^\s*class\s+/.test(service.toString());
        container.register({
            [service.name]: isClass ? asClass(service).singleton() : asValue(service),
        });
    });

    console.log('Databases connected and services initialized');
    return container;
};


export default initializeLocationContainer;
