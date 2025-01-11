import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import express from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import initializeAiContainer from '../services/DB/initAiContainer.js';
import { GraphQLError } from 'graphql';
import cors from 'cors';
import dotenv from 'dotenv';
import resolvers from './resolvers.js';
import LocationService from '../services/locationService.js';
import BookingService from '../services/bookingService.js';
import BookingRepository from '../services/repositories/bookingRepository.js';
import AiService from '../services/aiService.js';

dotenv.config();

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
    try {
        const mysqlContainer = await initializeAiContainer({ services: [] });


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
                                await mysqlContainer.resolve('mysqldb').end();
                            }
                        };
                    }
                }
            ],
            context: async ({ req }) => {
                // This function should be called for every request
                console.log('Apollo Server Context function executed');
                return {
                    token: req.headers.authorization || '',
                    dataSources: {
                        listingService: mysqlContainer.resolve('listingService'),
                        locationService: mysqlContainer.resolve('locationService'),
                        bookingService: mysqlContainer.resolve('bookingService'),
                        bookingRepository: mysqlContainer.resolve('bookingRepository'),
                        aiService: mysqlContainer.resolve('aiService'),
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

        httpServer.listen({ port: 4100 }, () =>
            console.log('Server is running on http://localhost:4100/graphql')
        );
    } catch (error) {
        console.error('Error starting Apollo Server:', error);
    }
};

startApolloServer();