import { createContainer, asValue, asClass } from 'awilix';
import connectToMongoDB from './connectMongoDB.js';

const baseMongoContainer = async () => {
  const mongodb = await connectToMongoDB(); // Establishing connection to MySQL database
  const container = createContainer();
  container.register({
    container: asValue(mongodb),
  });
  return container;
};

export default baseMongoContainer;