import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import http from 'http';
import express from 'express';
import cors from 'cors';
import initAccountContainer from '../services/DB/initAccountContainer.js';
import resolvers from './resolvers.js';


const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));
const startApolloServer = async () => {
  try {
    const container = await initAccountContainer();

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
                await container.resolve('mongodb').end();
              }
            };
          }
        }
      ],
      context: async ({ req }) => ({
        token: req.headers.authorization || '',
        dataSources: {
          accountService: container.resolve('accountService'),
          listingService: container.resolve('listingService'),  // Ensure this is included
          cartService: container.resolve('cartService'),        // Ensure this is included
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
          dataSources: {
            accountService: container.resolve('accountService'),
            listingService: container.resolve('listingService'),  // Ensure this is included
            cartService: container.resolve('cartService'),        // Ensure this is included
          }
        })
      })
    );

    httpServer.listen({ port: 4030 }, () => {
      console.log(`🚀 Server ready at http://localhost:4030/graphql`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startApolloServer();


