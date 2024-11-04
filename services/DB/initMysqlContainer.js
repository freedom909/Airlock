// container.js
import { createContainer, asClass, asValue } from 'awilix';
import BookingService from '../services/bookingService.js'; // Adjust the path as necessary
import ListingService from '../services/listingService.js'; // Adjust the path as necessary
import sequelize from '../models/seq.js';
import connectMysql from './connectMysqlDB.js';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
dotenv.config();

const initializeMysqlContainer = async ({services}) => {
  const mysqldb=await connectMysql(); // establishing connection to MySQL database
  const container = createContainer();
  container.register({
    mysqldb: asValue(mysqldb),
  });

  //register services dynamically
  services.forEach(service => {
    container.register({
      [service.name]: asClass(service).singleton(),
    });
  });
  console.log('MySQL Database connected');
  return container;
};

export default initializeMysqlContainer


