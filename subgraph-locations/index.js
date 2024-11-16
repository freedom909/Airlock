import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import express from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import initializeLocationContainer from '../services/DB/initLocationContainer.js';
import cors from 'cors';
// import dotenv from 'dotenv';
import resolvers from './resolvers.js';
import ListingService from '../services/listingService.js';

// dotenv.config();

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
  try {
    const mysqlContainer = await initializeLocationContainer({ services: [] });
    const app = express();
    const httpServer = http.createServer(app);

    const server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      introspection: true,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await mysqlContainer.resolve('mysqldb').end();
              }
            };
          }
        }
      ],
      context: async ({ req }) => {
        // Extract user ID or listing ID based on request details
        const userId = req.userId;
        const listingId = req.body?.variables?.input?.listingId; // Access listingId from request input if provided

        return {
          userId,
          context: {
            isListingCreation: true,
            userRole: 'host',
            listingId: listingId || null // Include listingId if it exists, or null if not provided
          },
          dataSources: {
            listingService: mysqlContainer.resolve('listingService'),
            locationService: mysqlContainer.resolve('locationService')
          }
        };
      }
    });

    await server.start();

    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const userId = req.userId;
          const listingId = req.body?.variables?.input?.listingId;

          return {
            userId,
            context: {
              isListingCreation: true,
              userRole: 'host',
              listingId: listingId || null
            },
            dataSources: {
              listingService: mysqlContainer.resolve('listingService'),
              locationService: mysqlContainer.resolve('locationService')
            }
          };
        }
      })
    );

    await new Promise((resolve) => httpServer.listen({ port: 4140 }, resolve));
    console.log(`Server is running on http://localhost:4140/graphql`);
  } catch (error) {
    console.error('Failed to start Apollo Server:', error);
  }
};

startApolloServer();
