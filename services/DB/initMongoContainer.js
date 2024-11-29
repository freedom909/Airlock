// services/DB/initMongoContainer.js
import pkg from 'mongodb';
const { MongoClient } = pkg;
import { createContainer, asClass, asValue } from 'awilix';
import connectToMongoDB from './connectMongoDB.js';


const initMongoContainer = async () => {
  try {
    const mongodb = connectToMongoDB();
    console.log('MongoDB Database connected');
    const container = createContainer();
    container.register({
      mongodb: asValue(mongodb),
    });
    return container;
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
};

export default initMongoContainer;

