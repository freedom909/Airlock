// locationCreation.test.js  
import request from 'supertest';
import app from './mockServer'; // Adjust if your mock server file is named differently  

describe('Location Creation', () => {
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

        const response = await request(app)  // Make sure to pass your mock server here  
            .post('/subgraph-location') // Adjust to your mock endpoint  
            .send(listingInput);

        expect(response.body).toEqual(expect.objectContaining({ success: true }));
    });
});