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
      context: async ({ req }) => ({
        token: req.headers.authorization || '',
        isListingCreation: false, // Initialize the flag to false by default
        dataSources: {
          locationService: mysqlContainer.resolve('locationService')
        }
      })
    });

    await server.start();

    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => ({
          token: req.headers.authorization || '',
          isListingCreation: false, // Initialize the flag to false by default
          dataSources: {
            locationService: mysqlContainer.resolve('locationService')
          }
        })
      })
    );

    httpServer.listen({ port: 4100 }, () =>
      console.log('Server is running on http://localhost:4100/graphql')
    );
  } catch (error) {
    console.error('Error starting Apollo Server:', error);
  }
};
startApolloServer();