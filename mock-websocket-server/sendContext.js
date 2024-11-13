// Assuming you are using a testing framework like Jest  
import app from ('./mockServer');
import request from 'supertest'; // For making requests to your mock server  
import jest from 'jest';

jest.mock('./mockServer'); // Mock your mock server

// Import your resolvers and the location creation function


describe('Location Creation', () => {
    let server;

    beforeAll(() => {
        // Start your mock server  
        server = require('./mockServer'); // Import your mock server  
    });

    afterAll(() => {
        server.close();
    });

    it('should create a location in the context of a listing', async () => {
        const context = { isListingCreation: true };
        const listingInput = {
            location: {
                name: 'Mock Location',
                latitude: 40.7128,
                longitude: -74.0060,
                address: '123 Mock St',
                city: 'New York',
                state: 'NY',
                country: 'USA',
                zipCode: '10001',
                radius: 10,
                units: 'km',
            },
            context,
        };

        const response = await request(server)
            .post('/subgraph-location')
            .send(listingInput);

        expect(response.body).toEqual(expect.objectContaining({ success: true }));
    });
});