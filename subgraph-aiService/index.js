import { ApolloServer } from '@apollo/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { readFileSync } from 'fs';
import express from 'express';
import http from 'http';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import initializeSupportContainer from '../services/DB/initSupportContainer.js';
import cors from 'cors';
import dotenv from 'dotenv';
import resolvers from './resolvers.js';
import generateToken from '../infrastructure/auth/generateToken.js';
import getUserFromToken from '../infrastructure/auth/getUserFromToken.js';

dotenv.config();
function mockGuestUser() {
    return {
        id: "guest1", // A unique ID for the guest  
        name: "Guest User", // Name for mock guest  
        role: "GUEST", // Role should match the enum value  
        picture: "http://example.com/guest.jpg", // Use a mock URL for the picture  
        nickname: "Guesty", // Nickname for the mock guest  
    };
}
const mockToken = generateToken(mockGuestUser())
const typeDefs = gql(readFileSync('./schema.graphql', { encoding: 'utf-8' }));

const startApolloServer = async () => {
    try {
        const container = await initializeSupportContainer();
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
                                await container.resolve('mysqldb').end();
                                await container.resolve('mongodb').end();
                            }
                        };
                    }
                }
            ],
            context: async ({ req }) => {
                const token = req.headers.authorization || '';
                let user;

                if (token) {
                    user = getUserFromToken(token);
                }

                if (!user) {
                    user = mockGuestUser(); // Always assign a user  
                }

                return {
                    user, // ensure user is defined  
                    dataSources: {
                        userService: container.resolve('userService'),
                        //bookingService: container.resolve('bookingService'),
                        //listingService: container.resolve('listingService'),
                        supportService: container.resolve('supportService'),
                        // Other data sources...  
                    }
                };
            },
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

                    return {
                        user,
                        dataSources: {
                            userService: container.resolve('userService'),// 
                            //bookingService: container.resolve('bookingService'),
                            // listingService: container.resolve('listingService'),
                            supportService: container.resolve('supportService'),
                        }
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