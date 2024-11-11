// initializeAmenityContainer.js
import { createContainer, asValue, asClass } from 'awilix';
import connectMysql from './connectMysqlDB.js';
import connectToMongoDB from './connectMongoDB.js';
import UserService from '../userService.js';
import UserRepository from '../repositories/userRepository.js';
import AmenityService from '../amenityService.js';
import axios from 'axios';
import sequelize from '../models/seq.js';
import AmenityRepository from '../repositories/amenityRepository.js';
// import httpClient from '../../frontend/src/__mocks__/httpClient.js'; // Import your configured HTTP client

const initializeAmenityContainer = async ({ services = [] } = {}) => {
  const mysqldb = await connectMysql();
  const mongodb = await connectToMongoDB();


  const container = createContainer();
  container.register({
    sequelize: asValue(sequelize),
    mysqldb: asValue(mysqldb),
    mongodb: asValue(mongodb),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    amenityRepository: asClass(AmenityRepository).singleton(),
    amenityService: asClass(AmenityService).singleton()
  });

  services.filter(service => !container.registrations[service.name])
    .forEach(service => {
      container.register({
        [service.name]: asClass(service).singleton(),
      });
    });

  console.log('Database connected');
  return container;
};

export default initializeAmenityContainer;
