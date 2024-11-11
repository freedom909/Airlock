import pkg from 'mongodb';
const { MongoClient } = pkg;
import { createContainer, asClass, asValue } from 'awilix';
import connectToMongoDB from './connectMongoDB.js';
import UserService from '../userService.js';
import UserRepository from '../repositories/userRepository.js';


const initUserContainer = async ({ services = [] } = {}) => {
    let mongodb;

    try {
        // Establish connection to MongoDB database
        mongodb = await connectToMongoDB();
        console.log('Connected to MongoDB database');
    } catch (error) {
        console.error('Error connecting to MongoDB database:', error);
        throw error;
    }

    // Create a container and register only requested services
    const container = createContainer();

    // Register MongoDB connection as it is likely required by multiple services
    container.register({
        mongodb: asValue(mongodb),
    });

    // Register UserRepository and UserService if specified in `services`
    if (services.includes('userService')) {
        container.register({
            userRepository: asClass(UserRepository).singleton(),
            userService: asClass(UserService).singleton(),
        });
    }

    return container;
};

export default initUserContainer;