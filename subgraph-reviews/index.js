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
import dotenv from 'dotenv';
import resolvers from './resolvers.js';
import ListingService from '../services/listingService.js';
import BookingService from '../services/bookingService.js';
import LocalAuthService from '../services/userService/localAuthService.js';
import OAuthService from '../services/userService/oauthService.js';
import TokenService from '../services/userService/tokenService.js';
import initMongoContainer from '../services/DB/initMongoContainer.js';
import initializeCartContainer from '../services/DB/initCartContainer.js';
import CartService from '../services/cartService.js';
import ReviewService from '../services/reviewService.js';
import initializeReviewContainer from '../services/DB/initReviewContainer.js';

dotenv.config();

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
  try {
    // Initialize MySQL and MongoDB containers
    const mysqlContainer = await initializeCartContainer({
      services: [ListingService, BookingService, CartService]
    });

    const mongoContainer = await initMongoContainer({
      services: [LocalAuthService, OAuthService, TokenService]
    });

    const neo4jContainer = await initializeReviewContainer({ services: [ReviewService] })
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
          userService: mongoContainer.resolve('userService') // Ensure correct resolution of services
        }
      })
    });

    await server.start();

    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server)
    );

    httpServer.listen({ port: 4080 }, () => {
      console.log(`🚀 Server ready at http://localhost:4080/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startApolloServer();
