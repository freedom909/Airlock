// infrastructure/DB/initMongoContainer.js
import pkg from 'mongodb';
const { MongoClient } = pkg;
import { createContainer, asClass, asValue } from 'awilix';
import UserRepository from '../repositories/userRepository.js';
<<<<<<< HEAD
import UserService from '../userService.js';
import ProfileService from '../proflieService.js';
import ProfileRepository from '../repositories/profileRepository.js';
import AccountService from '../accountService.js';
=======
import UserService from '../services/userService.js';
import ProfileService from '../services/proflieService.js';
import ProfileRepository from '../repositories/profileRepository.js';
import AccountService from '../services/accountService.js';
>>>>>>> 7208d0b14898127668337df5b09b0b6a24f868f3

import connectMongoDB from './connectMongoDB.js';

const initProfileContainer = async () => {
  try {
<<<<<<< HEAD
    const mongodb = await connectMongoDB();
    console.log('MongoDB Database connected');
    const container = createContainer();
    container.register({
      mongodb: asValue(mongodb),
      userRepository: asClass(UserRepository).singleton(),
      userService: asClass(UserService).singleton(),
      profileService: asClass(ProfileService).singleton(),
      profileRepository: asClass(ProfileRepository).singleton(),
      accountService: asClass(AccountService).singleton(),

    });
    return container;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
=======
  const mongodb = await connectMongoDB();
  console.log('MongoDB Database connected');
  const container = createContainer();
  container.register({
    mongodb: asValue(mongodb),
    userRepository: asClass(UserRepository).singleton(),
    userService: asClass(UserService).singleton(),
    profileService: asClass(ProfileService).singleton(),
    profileRepository: asClass(ProfileRepository).singleton(),
    accountService: asClass(AccountService).singleton(),

  });
  return container;
}catch (err){
  console.error('Error connecting to MongoDB:', err);
 }
>>>>>>> 7208d0b14898127668337df5b09b0b6a24f868f3
};

export default initProfileContainer;
