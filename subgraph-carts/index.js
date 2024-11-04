import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import express from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import initializeBookingContainer from '../services/DB/initBookingContainer.js';
import cors from 'cors';

import resolvers from './resolvers.js';
import ListingService from '../services/services/listingService.js';
import BookingService from '../services/bookingService.js';
import UserService from '../services/userService.js';
import initMongoContainer from '../infrastructure/DB/initMongoContainer.js';
import initializeCartContainer from '../services/DB/initCartContainer.js';
import CartService from '../services/services/cartService.js';
// import PaymentRepository from '../services/repositories/paymentRepository.js';
// import PaymentService from '../services/paymentService.js';


const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const startApolloServer = async () => {
  try {
    // Initialize MySQL and MongoDB containers
    const mysqlContainer = await initializeCartContainer({
      services: [ListingService, BookingService, CartService]
    });

    const mongoContainer = await initMongoContainer({
      services: [UserService]
    });

    const app = express();
    const httpServer = http.createServer(app);

    const server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await mysqlContainer.resolve('mysqldb').close();
                await mongoContainer.resolve('mongodb').close();  // Ensure MongoDB client is closed properly
              }
            };
          }
        }
      ],
      introspection: true,  // Enable introspection for GraphQL Playground
      context: async ({ req }) => ({
        token: req.headers.authorization || '',
        dataSources: {
          listingService: mysqlContainer.resolve('listingService'),  // Ensure correct resolution of services
          bookingService: mysqlContainer.resolve('bookingService'),  // Ensure correct resolution of services 
          cartService: mysqlContainer.resolve('cartService'),
          // paymentService: mysqlContainer.resolve('paymentService'),
          userService: mongoContainer.resolve('userService')
          // Ensure correct resolution of services
        }
      })
    });

    await server.start();

    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server,
        expressMiddleware(server, {
          context: async ({ req }) => ({
            token: req.headers.authorization || '',
            dataSources: {
              userService: container.resolve('userService'),
            }
          })
        })
      ));

    httpServer.listen({ port: 4060 }, () => {
      console.log(`🚀 Server ready at http://localhost:4060/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startApolloServer();

// import { ApolloServer } from 'apollo-server';
// import resolvers from './resolvers.js';
// import CartService from '../infrastructure/services/cartService.js';
// import BookingRepository from '../infrastructure/repositories/bookingRepository.js';
// import PaymentRepository from '../infrastructure/repositories/paymentRepository.js';
// import ListingRepository from '../infrastructure/repositories/listingRepository.js';
// import CartRepository from '../infrastructure/repositories/cartRepository.js';
// import UserRepository from '../infrastructure/repositories/userRepository.js';
// import { gql } from 'graphql-tag';
// import { readFileSync } from 'fs';
// //Assuming you have some configuration for your repositories
// const dbConfig = { /* your db config */ };
// const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   dataSources: () => ({
//     cartService: new CartService({
//       bookingRepository: new BookingRepository(dbConfig),
//       paymentRepository: new PaymentRepository(dbConfig),
//       listingRepository: new ListingRepository(dbConfig),
//       cartRepository: new CartRepository(dbConfig),
//       userRepository: new UserRepository(dbConfig),
//     }),
//     // ... other data sources
//   }),
//   context: ({ req }) => {
//     // Your context setup
//   },
// });

// server.listen().then(({ url }) => {
//   console.log(`🚀 Server ready at ${url}`);
// });
