// infrastructure/DB/initMongoContainer.js
import pkg from 'mongodb';
const { MongoClient } = pkg;
import { createContainer, asClass, asValue } from 'awilix';
import UserRepository from '../repositories/userRepository.js';
import UserService from '../userService.js';
import connectMongoDB from './connectMongoDB.js';

const initMongoContainer = async () => {
  try {
    const mongodb = await connectMongoDB();
    console.log('MongoDB Database connected');
    const container = createContainer();
    container.register({
      mongodb: asValue(mongodb),
      userRepository: asClass(UserRepository).singleton(),
      userService: asClass(UserService).singleton()
    });
    return container;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};

export default initMongoContainer;
