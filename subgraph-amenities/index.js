// index.js
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import express from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import dotenv from 'dotenv';
import resolvers from './resolvers.js';
import initMongoContainer from '../services/DB/initMongoContainer.js'
import initializeAmenityContainer from '../services/DB/initAmenityContainer.js';
import ListingService from '../services/services/listingService.js';
import AmenityService from '../services/services/amenityService.js';
import getUserFromToken from '../infrastructure/auth/getUserFromToken.js';
import UserService from '../services/services/userService.js';


dotenv.config();

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
  try {
    const mysqlContainer = await initializeAmenityContainer({
      services: [ListingService, AmenityService],
    });
    const mongoContainer = await initMongoContainer({
      services: [UserService],
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
                await mongoContainer.resolve('mongodb').close();
              }
            };
          }
        }
      ],
      introspection: true,
      context: async ({ req }) => {
        const token = req.headers.authorization || '';
        const user = getUserFromToken(token);
        return {
          user,
          dataSources: {
            listingService: mysqlContainer.resolve('listingService'),
            userService: mongoContainer.resolve('userService'),
            amenityService: mysqlContainer.resolve('amenityService'), // Add amenityService
          },
        };
      },
    });
    await server.start();

    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server)
    );
    httpServer.listen({ port: 4012 }, () => {
      console.log(`🚀 Server ready at http://localhost:4012/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startApolloServer();
