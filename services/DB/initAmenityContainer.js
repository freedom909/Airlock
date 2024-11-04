// initializeAmenityContainer.js
import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import ListingService from '../services/listingService.js';
import ListingRepository from '../repositories/listingRepository.js';
import UserService from '../services/userService.js';
import UserRepository from '../repositories/userRepository.js';
import AmenityService from '../services/amenityService.js';
import axios from 'axios';
import httpClient from '../../frontend/src/__mocks__/httpClient.js'; // Import your configured HTTP client

const initializeAmenityContainer = async ({ services = [] } = {}) => {
  const mysqldb = await connectMysql();
  const mongodb = await connectToMongoDB();

  const container = createContainer();
  container.register({
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),
    listingService: asClass(ListingService).singleton(),
    amenityService: asClass(AmenityService).singleton().inject(() => ({
      sequelize: mysqldb,
      httpClient: httpClient,
    })),
  });

  services.forEach(service => {
    container.register({
      [service.name]: asClass(service).singleton(),
    });
  });

  console.log('Database connected');
  return container;
};

export default initializeAmenityContainer;
