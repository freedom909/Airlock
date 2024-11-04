import pkg from 'mongodb';
const { MongoClient } = pkg;
import { createContainer, asClass, asValue } from 'awilix';
import connectToMongoDB from './connectMongoDB.js';
import AccountService from '../services/accountService.js';
import AccountRepository from '../repositories/accountRepository.js';
import UserService from '../services/userService.js';
import UserRepository from '../repositories/userRepository.js';
import connectMysql from './connectMysqlDB.js';
import ListingRepository from '../repositories/listingRepository.js';
import CartRepository from '../repositories/cartRepository.js';
const initAccountContainer = async ({ services = [] } = {}) => {
  let mongodb;

  try {
    // Establish connection to MongoDB database
    mongodb = await connectToMongoDB();
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MongoDB database:', error);
    throw error;
  }
  let mysqldb
  try {
    mysqldb=await connectMysql()
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.error('Error connecting to MysqlDB database:', error);
    throw error;
  
  }

  // Create a container and register services and repositories
  const container = createContainer();
  container.register({
    mongodb: asValue(mongodb),
    mysqldb: asValue(mysqldb),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    accountService: asClass(AccountService).singleton(),
    accountRepository: asClass(AccountRepository).singleton(),
    listingRepository: asClass(ListingRepository).singleton(),  // Ensure this is registered
    cartRepository: asClass(CartRepository).singleton(),
  });
  return container;
};

export default initAccountContainer;
