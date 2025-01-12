
import { AuthenticationError } from '../infrastructure/utils/errors.js';
import Listing from '../services/models/listing.js';
import dbConfig from '../services/DB/dbConfig.js';
import Location from '../services/models/location.js';



const resolvers = {
    Mutation: {
        createLocation: async (_, { locationInput }, { context, dataSources }) => {
            console.log("Location Input received in createLocation:", locationInput); // Log locationInput
            // Log context to make sure it is correctly passed
            console.log('Context in createLocation:', context);
            if (!locationInput) {  //"Location input is required but was not provided.",
                throw new Error("Location input is required but was not provided.");
            }
            const { isListingCreation } = context || {};  // Get the context property

            // If context is undefined or doesn't have `isListingCreation`, throw an error
            if (!isListingCreation) {
                throw new AuthenticationError("Cannot create location without proper listing context.");
            }

            console.log("Context received for location creation:", context);

            // Proceed with the rest of the logic to create the location
            const { locationService } = dataSources;
            const requiredFields = ['name', 'latitude', 'longitude', 'address', 'city', 'state', 'country', 'zipCode', 'radius', 'units'];
            for (const field of requiredFields) {
                if (!locationInput[field]) {
                    throw new Error(`Location data must include ${field}.`);
                }
            }

            try {
                const newLocation = await locationService.createLocation(locationInput);
                return newLocation; // Return the newly created location
            } catch (error) {
                console.error("Error creating location:", error);
                throw new Error("Failed to create location");
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