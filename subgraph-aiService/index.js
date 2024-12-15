import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import express from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import initializeAiContainer from '../services/DB/initAiContainer.js';

import initializeListingContainer from '../services/DB/initListingContainer.js';
import cors from 'cors';
import dotenv from 'dotenv';
import resolvers from './resolvers.js';
import generateToken from '../infrastructure/auth/generateToken.js';
import getUserFromToken from '../infrastructure/auth/getUserFromToken.js';

dotenv.config();

const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
    try {
        const mongodbContainer = await initializeAiContainer();
        const mysqlContainer = await initializeListingContainer();
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
                                await mysqlContainer.resolve('mysqldb').end(); // 'mysqldb' unknown word
                                await mongodbContainer.resolve('mongodb').end();
                            }
                        };
                    }
                }
            ],
        });

        await server.start();
        app.use(
            '/graphql',
            cors(),
            express.json(),
            expressMiddleware(server, {
                context: async ({ req }) => {
                    const token = req.headers.authorization || '';
                    let user;

                    if (token) {
                        user = await getUserFromToken(token);
                    }

                    if (!user) {
                        user = mockGuestUser(); // Always assign a user  
                    }
                    console.log("User:", user); // Log resolved user
                    const userService = {
                        localAuthService: container.resolve('localAuthService'),
                        oauthService: container.resolve('oAuthService'),
                        tokenService: container.resolve('tokenService'),
                    };
                    return {
                        user,
                        dataSources: {
                            userService,
                            bookingService: container.resolve('bookingService'),
                            listingService: container.resolve('listingService'),

                        },
                        aiService: container.resolve('aiService'),
                    };
                },
            })
        );

        const port = 4100;
        console.log(`Starting server on port ${port}...`); // Additional debug information
        httpServer.listen({ port }, () => {
            console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
        });
    } catch (error) {
        console.error("Error starting the Apollo Server:", error);
    }
};

// Start the Apollo server  
startApolloServer();