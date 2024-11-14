

import Listing from '../services/models/listing.js';
import dbConfig from '../services/DB/dbconfig.js';
import Location from '../services/models/location.js';


const resolvers = {
    Mutation: {
        createLocation: async (_, { input }, { dataSources, userId, context }) => {
            // if (!userId) throw new AuthenticationError('User not authenticated');
            // if (!isHostOfListing ||!isAdmin) {
            //   throw new AuthenticationError(`you don't have right to update this list`)
            // }
            const { locationService } = dataSources;
            const { locationInput } = input;
            if (!locationInput) {
                throw new Error('Location input is required');
            }

            if (context.isListingCreation) {
                throw new AuthenticationError(`you don't have right to create a new location`)
            }
            const requireFields = ['name', 'latitude', 'longitude', 'address', 'city', 'state', 'country', 'zipCode', 'radius', 'units'];
            for (let prop of requireFields) {
                if (!locationInput[prop]) {
                    throw new Error(`Location data must include ${prop}.`);
                }
                console.log('Input received:', input); // TypeError: Cannot destructure property 'name' of 'input' as it is undefined.


                try {
                    console.log('Arguments received:', input); // Check if input is defined
                    console.log('Context:', context); // Check the context for necessary flags

                    // Destructure fields from input
                    const { name, latitude, longitude, address, city, state, country, zipCode, radius, units } = input;

                    // Validate input fields
                    if (!name || !latitude || !longitude || !address || !city || !state || !country || !zipCode || !radius || !units) {
                        throw new Error('All fields are required for creating a location.');
                    }

                    const newLocation = await locationService.createLocation(name, latitude, longitude, address, city, state, country, zipCode, radius, units);
                    return newLocation; // Return the newly created location

                } catch (error) {
                    console.error('Error creating location:', error);
                    throw new Error('Failed to create location');
                }
            }

        },
        deleteLocation: (_, { id }, { dataSources, user }) => {
            // if (!userId) throw new AuthenticationError('User not authenticated');
            // if (!isHostOfListing || !isAdmin) {
            //   throw new AuthenticationError(`you don't have right to update this list`)
            // }
            // if (!id) {
            //     throw new Error('you must input a location ID ');
            // }
            try {
                return dataSources.locationService.deleteLocation(id);
            } catch (error) {
                console.error('Error in deleteLocation resolver:', error);
            }
        },
        // updateLocation: (_, { id, input }, { dataSources }) => {
        updateLocation: (_, { input }, { dataSources }) => {
            return dataSources.locationService.updateLocation(input);
        },
    },
    Query: {
        locations: (_, __, { dataSources }) => {
            return dataSources.locationService.getAllLocations();
        },
        location: (_, { id }, { dataSources }) => {
            return dataSources.locationService.getLocationById(id);
        },
        listings: {

        },

    }
}

export default resolvers;