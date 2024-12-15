import express from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import initUserContainer from '../services/DB/initUserContainer.js'; // Your container initialization function
import { readFileSync } from 'fs';

import { gql } from 'graphql-tag';
import resolvers from './resolvers.js';
import cors from 'cors';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import OAuthService from '../services/userService/oauthService.js';
import dotenv from 'dotenv';
dotenv.config();

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const startApolloServer = async () => {
  try {
    const container = await initUserContainer({ services: [] });
    const app = express();
    const httpServer = http.createServer(app);

    const server = new ApolloServer({
      schema: buildSubgraphSchema({ typeDefs, resolvers }),
      introspection: true, // Ensure introspection is enabled
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            console.log('Server is starting...');
            return {
              async drainServer() {
                console.log('Draining server...');
                await container.resolve('mongodb').end();
              },
            };
          },
        },
      ],
    });

    await server.start();

    // Define context in expressMiddleware
    app.use(
      '/graphql',
      cors(),
      express.json(),
      expressMiddleware(server, {
        context: async ({ req }) => {
          const token = req.headers.authorization || '';

          const userService = {
            localAuthService: container.resolve('localAuthService'),
            oAuthService: container.resolve('oAuthService'),
            tokenService: container.resolve('tokenService'),
          };

          return {
            token,
            dataSources: {
              userService,
            },
          };
        },
      })
    );

    httpServer.listen({ port: 4010 }, () =>
      console.log('🚀 Server ready at http://localhost:4010/graphql')
    );
  } catch (error) {
    console.error('Error starting Apollo Server:', error);
  }
};

startApolloServer();