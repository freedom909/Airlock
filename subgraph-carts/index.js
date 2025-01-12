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
import ListingService from '../services/listingService.js';
import BookingService from '../services/bookingService.js';
import UserService from '../services/userService/index.js';
import initMongoContainer from '../services/DB/initMongoContainer.js';
import initializeCartContainer from '../services/DB/initCartContainer.js';
import CartService from '../services/cartService.js';
import PaymentRepository from '../services/repositories/paymentRepository.js';
import PaymentService from '../services/paymentService.js';

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
  try {
    // Initialize MySQL and MongoDB containers
    const mysqlContainer = await initializeCartContainer({
      services: [ListingService, BookingService]
    });

    const mongoContainer = await initMongoContainer({
      services: [UserService]
    });

    const app = express();
    const httpServer = http.createServer(app);

    // Initialize Apollo Server
    const server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                // Close the WebSocket server and database connections
                serverCleanup.dispose();
                await mysqlContainer.resolve('mysqldb').close();
                await mongoContainer.resolve('mongodb').close();
              }
            };
          }
        }
      ],

      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const user = getUserFromToken(token);
        const userService = {
          localAuthService: container.resolve('localAuthService'),
          oAuthService: container.resolve('oAuthService'),
          tokenService: container.resolve('tokenService'),
        };

        return {
          user,
          dataSources: {
            listingService: mysqlContainer.resolve('listingService'),  // Resolve MySQL services
            bookingService: mysqlContainer.resolve('bookingService'),
            cartService: mysqlContainer.resolve('cartService'),
            paymentService: mysqlContainer.resolve('paymentService'),
            paymentRepository: mysqlContainer.resolve('paymentRepository'), //
            // paymentService: mysqlContainer.resolve('paymentService'),  // Resolve MySQL services
            userService,// Resolve MongoDB services
            cacheClient, // Cache client is available globally, no need to resolve from container
          }
        };
      }
    });

    // Start Apollo Server
    await server.start();

    // Apply Express middleware for handling requests
    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server)
    );

    // Start the HTTP server
    httpServer.listen({ port: 4060 }, () => {
      console.log(`🚀 Server ready at http://localhost:4060/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

// Start the server
startApolloServer();