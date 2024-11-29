import { AuthenticationError, ForbiddenError } from '../infrastructure/utils/errors.js';
import { permissions } from '../infrastructure/auth/permission.js';
import Listing from '../services/models/listing.js';
import Coordinate from '../services/models/location.js';
import dbConfig from '../services/DB/dbconfig.js';
import Location from '../services/models/location.js';
import { GraphQLError } from 'graphql';
import Amenity from '../services/models/amenity.js';
import transaction, { Op } from '@sequelize/core'
import calculateDistance from './calculateDistance.js';
import { resolve } from 'path';
const { listingWithPermissions, isHostOfListing, isAdmin } = permissions;
import { v4 as uuidv4, validate as uuidValidate } from 'uuid'
const resolvers = {

  Query: {
    getNearbyListings: async (_, { latitude, longitude, radius }, { dataSources }) => {

      if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radius !== 'number' || radius <= 0) {
        throw new UserInputError('Invalid Input: Latitude, longitude, and radius must be valid numbers, with radius greater than 0.');
      }
      const { listingService, locationService } = dataSources;
      let transaction;
      try {
        const nearbyListings = await listingService.getNearbyListings({ latitude, longitude, radius: 5 });
        nearbyListings.forEach(listing => {
          if (!listing.title) {
            console.warn(`Listing with ID ${listing.id} is missing a title.`);
          }
          if (!listing.id) {
            console.warn(`Listing is missing an ID:`, JSON.stringify(listing, null, 2));
          }
        });
        console.log('Nearby Listings fetch result:', JSON.stringify(nearbyListings, null, 2));

        // Map the output to ensure it contains every required field
        const mappedListings = nearbyListings.map(async listing => {
          const location = await locationService.getLocationById(listing.locationId); // Assuming this is async  

          return {
            id: listing.id || 'default_id',
            title: listing.title || 'Untitled Listing', // Provide default if title is missing  
            description: listing.description || 'No description available',
            pictures: listing.pictures || [],
            numOfBeds: listing.numOfBeds || 0,
            costPerNight: listing.costPerNight || 0,
            isFeatured: listing.isFeatured || false,
            saleAmount: listing.saleAmount || 0,
            checkInDate: listing.checkInDate || 'default_check_in_date',
            checkOutDate: listing.checkOutDate || 'default_check_out_date',
            distance: listing.distance || 0,
            location: {
              id: location?.id || 'default_location_id', // Use fetched location  
              latitude: location?.latitude || 0,
              longitude: location?.longitude || 0,
              radius: location?.radius || 0,
              units: location?.units || 'km',
              city: location?.city || 'unknown',
              listingId: listing.id || 'unknown-listing',
              name: location?.name || 'UFO',
              country: location?.country || 'USA',
              zipCode: location?.zipCode || '1234567', // Fixed typing issue  
              state: location?.state || 'Washington', // Fixed typing issue  
            },
            locationType: listing.locationType || 'ROOM',
            bookingNumber: listing.bookingNumber || 0,
            amenities: listing.amenities || [],
            host: {
              id: listing.host?.id || 'default_host_id',
              name: listing.host?.name || 'default_host_name',
              picture: listing.host?.picture || 'default_host_picture_url'
            },
            numberOfUpcomingBookings: listing.numberOfUpcomingBookings || 0,
            currentlyBookedDates: listing.currentlyBookedDates || [],
            totalCost: listing.totalCost || 0,
            bookings: listing.bookings || [],
            availability: listing.availability || [],
            priceRange: { min: listing.priceRange?.min || 0, max: listing.priceRange?.max || 0 },
            totalCostRange: { min: listing.totalCostRange?.min || 0, max: listing.totalCostRange?.max || 0 }
          };
        });

        console.log("Mapped Listings:", mappedListings);

        return mappedListings;
      } catch (error) {
        console.error('Error fetching nearby listings:', error);
        throw new Error('Error fetching nearby listings');
      }
    },


    fullTextSearchListings: async (_, { input }, { dataSources }) => {
      const { listingService } = dataSources
      if (!listingService) {
        throw new Error("ListingService is not initialized.");
      }


      const { searchText, limit = 10, offset = 0 } = input;
      // Search in the `description` field using LIKE or other full-text search methods
      const listings = await Listing.findAll({
        where: {
          description: {
            [Op.like]: `%${searchText}%`,  // For full-text search in MySQL/PostgreSQL with LIKE
            //[Op.match]: sequelize.fn('to_tsquery', searchText),  // For PostgreSQL full-text search with tsvector
          }
        },
        limit,
        offset,
      });
      const totalCount = await Listing.count({
        where: {
          description: {
            [Op.like]: `%${searchText}%`,  // Use the same condition for counting results
          }
        }
      });

      return {
        listings,
        totalCount
      };
    },

    location: async (parent, _, { dataSources }) => {
      const { listingService } = dataSources;
      const listingId = parent.id;  // Use the listing's ID from the parent

      try {
        const result = await listingService.getLocationById(listingId);  // Fetch location by listingId

        if (!result) {
          console.error('Location not found for listing ID:', listingId);
          return null;  // Return null if no location is found
        }

        // Return the location object as per the schema
        return {
          id: result.id,
          name: result.name,
          address: result.address,
          city: result.city,
          state: result.state,
          country: result.country,
          zipCode: result.zipCode,
        };
      } catch (error) {
        console.error('Error fetching location:', error);
        return null;
      }
    },

    hotListingsByMoney: async (_, __, { dataSources }) => {
      const { listingService } = dataSources;
      try {
        const listings = await listingService.hotListingsByMoneyBookingTop5();
        return listings;
      } catch (error) {
        throw new Error('Failed to fetch hot listings by money');
      }
    },

    hotListingsByBookingNumber: async (_, __, { dataSources }) => {
      const { listingService } = dataSources
      try {
        return listingService.hotListingsByNumberBookingTop5();
      } catch (error) {
        throw new Error('Failed to fetch hot listings by booking number');
      }
    },

    listings: async (_, args, { dataSources }) => {
      try {
        const listings = await Listing.findAll({
          include: [
            {
              model: Amenity,
              as: 'amenities', // This alias must match the association
              through: { attributes: [] },
              attributes: ['name', 'category'],
            },
            {
              model: Location,
              as: 'location', // This alias must match the association
              attributes: ['state', 'address', 'city', 'country', 'zipCode', 'latitude', 'longitude', 'name', 'radius'],
            }
          ],
        });
        console.log(JSON.stringify(listings, null, 2));  // Log the data for debugging
        if (!listings) {
          throw new Error('No listings found');
        }

        return listings.map(listing => ({
          ...listing.toJSON(),
          checkInDate: new Date(listing.checkInDate).toISOString(),
          checkOutDate: new Date(listing.checkOutDate).toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching listings:', error);
        throw new Error('Failed to fetch listings');
      }
    },
    //"Return the listings that belong to the currently logged-in host"
    hostListings: async (_, { hostId }, { dataSources }) => {
      if (!hostId) {
        throw new AuthenticationError('You must be logged in to access this resource');
      }
      try {
        const listings = await Listing.findAll({
          where: { hostId },
          include: [
            {
              model: Amenity,
              as: 'amenities', // This alias must match the association
              through: { attributes: [] },
              attributes: ['name', 'category'],
            },
            {
              model: Location,
              as: 'location', // This alias must match the association
              attributes: ['state', 'address', 'city', 'country', 'zipCode', 'latitude', 'longitude', 'name', 'radius'],
            }
          ],
        });
      } catch (error) {
        console.error('Error fetching listings:', error);
        throw new Error('Failed to fetch listings');
      }
    },
    listing: async (_, { id }, { dataSources }) => {
      try {
        const listing = await Listing.findOne({
          where: { id },
          include: [
            {
              model: Amenity,
              as: 'amenities', // This alias must match the association
              through: { attributes: [] },
              attributes: ['name', 'category'],
            },
            {
              model: Location,
              as: 'location', // This alias must match the association
              attributes: ['state', 'address', 'city', 'country', 'zipCode', 'latitude', 'longitude', 'name', 'radius'],
            }
          ],
        });
        console.log(JSON.stringify(listing.toJSON(), null, 2));  // Log the data for debugging
        if (!listing) {
          throw new Error('Listing not found');
        }
        return {
          ...listing.toJSON(),
          checkInDate: new Date(listing.checkInDate).toISOString(),
          checkOutDate: new Date(listing.checkOutDate).toISOString(),
        };
      } catch (error) {
        console.error('Error fetching listing:', error);
        throw new GraphQLError('Error fetching listing', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },


    featuredListings: async () => {
      // Fetch featured listings with coordinates
      return await Listing.findAll({
        where: { isFeatured: true }, // Filter for featured listings
        attributes: ['id', 'locationType', 'title', 'checkInDate', 'checkOutDate', 'photoThumbnail', 'description', 'costPerNight', 'saleAmount'], // Include id, locationType, title
        include: [
          {
            model: Amenity,
            as: 'amenities',
            through: { attributes: [] },
            attributes: ['name', 'category'],
          },
          {
            model: Location,
            as: 'location', // Ensure alias matches the association
            attributes: ['state', 'address', 'city', 'country', 'zipCode', 'latitude', 'longitude', 'name', 'radius'],
          }
        ],
      });
    },

    hotListings: async (_, __, { dataSources }) => {
      const { listingService } = dataSources;
      return listingService.getTop5Listings();
    },

    listingAmenities: (_, __, { dataSources }) => {
      const { listingService } = dataSources;
      return listingService.getAllAmenities();
    },

    searchListingOfBooking: async (_, { criteria }, { dataSources }) => {
      try {
        const { listingService, bookingService } = dataSources;
        const { numOfBeds, reservedDate, page, limit, sortBy } = criteria;
        const { checkInDate, checkOutDate } = reservedDate;
        const listings = await listingService.searchListingOfBooking({
          numOfBeds,
          checkInDate,
          checkOutDate,
          page,
          limit,
          sortBy
        });
        const listingAvailability = await Promise.all(
          listings.map(listing =>
            bookingService.isListingAvailable({ listingId: listing.id, checkInDate, checkOutDate })
          )
        );
        return listings.filter((listing, index) => listingAvailability[index]);
      } catch (error) {
        console.error('Error searching listings:', error);
        throw new Error('Failed to search listings');
      }
    }
  },
  Mutation: {
    deleteListing: async (_, { input }, { dataSources, userId }) => {
      //if (!userId) throw new AuthenticationError('User not authenticated');
      //if (!isHostOfListing || !isAdmin) {
      //throw new AuthenticationError(`you don't have right to delete this list`)
      //}
      const { listingId } = input; // Destructure listingId from input
      if (!listingId) throw new Error('Listing ID not provided');
      console.log('Attempting to delete listing with ID:', listingId); // Log the listing ID
      try {
        await dataSources.listingService.deleteListing(listingId);
        return {
          code: 200,
          success: true,
          message: 'Listing successfully deleted',
          listing: null // Or return listing details if needed
        };
      } catch (error) {
        console.error('Error deleting listing:', error);
        return {
          code: 500,
          success: false,
          message: error.message,
          listing: null
        };
      }
    },

    createListing: async (_, { input }, { dataSources, context, userId }) => {
      //if (!userId) throw new AuthenticationError('User not authenticated');
      //if (!isHostOfListing || !isAdmin) {
      //throw new AuthenticationError(`you don't have right to delete this list`)
      //}
      console.log("Context received in createListing:", context);

      if (!context || !context.dataSources) {
        throw new Error("Invalid context or dataSources missing.");
      }

      const { locationService, listingService } = dataSources;
      let locationId;

      if (input.locationInput) {
        // Handle new location  
        console.log("New location input received", input.locationInput);
        const context = { isListingCreation: true, userRole: 'host', listingId: null };
        const newLocation = await locationService.createLocation(input.locationInput, { context });

        if (!newLocation || !newLocation.id) {
          throw new Error("Failed to create location.");
        }

        locationId = newLocation.id;
        console.log("New location created with ID:", locationId);
      } else {
        locationId = input.locationId;
        if (!locationId || !uuidValidate(locationId)) {
          throw new Error("Invalid locationId.");
        }
      }

      // Logging parameters before listing creation  
      console.log("Listing data to create:", {
        description: input.description,
        pictures: input.pictures,
        costPerNight: input.costPerNight,
        locationType: input.locationType,
        listingStatus: input.listingStatus,
        title: input.title,
        price: input.price,
        numOfBeds: input.numOfBeds,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        hostId: input.hostId,
        locationId: locationId,
      });

      // Transaction for listing creation  
      const transaction = await listingService.sequelize.transaction();
      try {
        if (!input.hostId || !uuidValidate(input.hostId)) {
          throw new Error("Invalid hostId.");
        }
        const listingInput = {
          ...input,
          locationId,
          hostId: input.hostId,
        };
        console.log("Listing input before creation:", listingInput);

        const newListing = await listingService.createListing(listingInput, { transaction });

        // Log immediately after creation  
        console.log("New listing created:", newListing);

        if (!newListing || !newListing.id) {
          throw new Error("Failed to create listing, newListing is undefined or lacks an ID.");
        }

        console.log("ListingId created after creation:", newListing.id);
        if (!uuidValidate(newListing.id)) {
          throw new Error("Failed to create listing due to invalid ID.");
        }

        // Continue processing...  
        await transaction.commit();
        return {
          code: 200,
          success: true,
          message: 'Listing successfully created!',
          listing: newListing,
        };
      } catch (error) {
        await transaction.rollback();
        console.error("Error creating listing:", error.message); // Log error message  
        throw new GraphQLError("Listing creation failed.");
      }
    },

    updateListingStatus: async (_, { input }, { dataSources }) => {
      // if (!userId) throw new AuthenticationError('User not authenticated');
      // if (!listingWithPermissions) {
      //   throw new AuthenticationError('User does not have permissions to create a listing');
      // }
      const { id, listingStatus } = input;
      console.log('Input received:', input);
      const { listingService } = dataSources;
      try {
        const listing = await Listing.findByPk(id);
        console.log('Listing', listing);

        if (!listing) {
          return {
            success: false,  // Return false if the listing is not found
            listingStatus: null,
            code: '404',
            message: 'Listing not found',
          };
        }

        listing.listingStatus = listingStatus;
        await listing.save();

        return {
          success: true,  // Return true if the update was successful
          listingStatus: listing.listingStatus,
          code: '200',
          message: 'Listing status updated successfully',
        };
      } catch (error) {
        console.error('Error updating listing status:', error);
        return {
          success: false,  // Return false if there was an error
          listingStatus: null,
          code: '500',
          message: 'Error updating listing status',
        };
      }
    },

    updateListing: async (_, { listingId, listing }, { dataSources, userId }) => {
      // if (!userId) throw new AuthenticationError('User not authenticated');
      //if (!isHostOfListing || !isAdmin) {
      //  throw new AuthenticationError(`you don't have right to update this list`)
      //}
      const { listingService } = dataSources;

      if (!listingId) throw new Error('Listing ID not provided');
      try {
        const updatedListing = await listingService.updateListing({ listing, listingId });
        return {
          code: 200,
          success: true,
          message: 'Listing successfully updated',
          listing: updatedListing
        };
      } catch (error) {
        console.error(error);
        return {
          code: 500,
          success: false,
          message: error.message
        };
      }
    },
  },

  Listing: {
    __resolveReference: async (reference, { dataSources }) => {
      try {
        const listing = await Listing.findOne({
          where: { id: reference.id },
          include: [
            {
              model: Amenity,
              as: 'amenities',
              through: { attributes: [] },
              attributes: ['name', 'category'],
            },
            {
              model: Location,
              as: 'location',
              attributes: ['state', 'address', 'city', 'country', 'zipCode', 'latitude', 'longitude', 'name', 'radius'],
            }
          ]
        })
        if (!listing) {
          throw new Error('Listing not found');
        }
        return {
          ...listing.toJSON(),
          checkInDate: new Date(listing.checkInDate).toISOString(),
          checkOutDate: new Date(listing.checkOutDate).toISOString(),
        };
      } catch (error) {
        console.error('Error resolving listing reference:', error);
        throw new Error('Failed to resolve listing reference');
      }
    },

    host: ({ hostId }) => {
      return { id: hostId };
    },

    totalCost: async (parent, { checkInDate, checkOutDate }, { dataSources }) => {
      const { listingService } = dataSources;
      const { id } = parent;

      try {
        // Fetch the listing by its ID
        const listing = await Listing.findOne({ where: { id } });
        console.log(listing.totalCost); // Outputs the calculated total cost
        if (!listing) {
          console.log(`No listing found with ID: ${id}`);
          return null;
        }
        if (typeof listing.costPerNight !== 'number') {
          console.log('Invalid or missing costPerNight:', listing.costPerNight);
          return null;
        }

        // Parse dates
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);

        // Check if dates are valid
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          console.log('Invalid dates provided.');
          return null;
        }

        // Calculate the number of nights
        const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate the total cost
        const totalCost = listing.costPerNight * numberOfNights;

        return totalCost;
      } catch (error) {
        console.error('Error in totalCost resolver:', error);
        return null;
      }
    },

    __resolveType(listing) {
      if (listing.apartment) {
        return 'ApartmentListing';
      } else if (listing.house) {
        return 'HouseListing';
      }
      return 'OtherListingType';
    },

    amenities: async ({ id }, _, { dataSources }) => {
      const { listingService } = dataSources;
      try {
        const listing = await listingService.getListing(id);
        if (!listing) throw new Error('Listing not found');
        const amenities = listing.amenities || [];
        return amenities.map(amenity => ({
          ...amenity,
          category: amenity.category.replace(' ', '_').toUpperCase(),
          name: amenity.name.replace(' ', '_').toUpperCase()
        }));
      } catch (error) {
        console.error(`Error fetching amenities for listing ${id}:`, error);
        throw new Error('Failed to fetch amenities');
      }
    },
    currentlyBookedDates: ({ id }, _, { dataSources }) => {
      const { bookingService } = dataSources;
      return bookingService.getCurrentlyBookedDateRangesForListing(id);
    },
    bookings: async ({ id }, _, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError('User not authenticated');
      if (!listingWithPermissions) {
        throw new ForbiddenError('User does not have permissions to search the listings');
      }
      try {
        const { listingService, bookingService } = dataSources;
        const { numOfBeds, reservedDate, page, limit, sortBy } = criteria;
        const { checkInDate, checkOutDate } = reservedDate;
        const listings = await listingService.searchListingOfBooking({
          numOfBeds,
          checkInDate,
          checkOutDate,
          page,
          limit,
          sortBy
        });
        const listingAvailability = await Promise.all(
          listings.map(listing =>
            bookingService.isListingAvailable({ listingId: listing.id, checkInDate, checkOutDate })
          )
        );
        return listings.filter((listing, index) => listingAvailability[index]);
      } catch (error) {
        console.error('Error searching listings:', error);
        throw new Error('Failed to search listings');
      }
    },

    numberOfUpcomingBookings: async ({ id }, _, { dataSources }) => {
      const { bookingService } = dataSources;
      const bookings = await bookingService.getBookingsForListing(id, 'UPCOMING') || [];
      return bookings.length;
    },

    getListingWithLocation: async (_, { listingId }, { dataSources }) => {
      try {
        const listing = await dataSources.listingService.getListingById(listingId);  // Fetch listing details
        if (!listing) {
          throw new Error(`Listing not found for ID: ${listingId}`);
        }

        return listing;  // Return the listing object
      } catch (error) {
        console.error('Error fetching listing:', error);
        throw new Error('Failed to fetch listing');
      }
    },

    Location: {
      locations: async ({ parent }, _, { dataSources }) => {

        try {
          const locations = await models.Listing.findByPk({
            where: { id: parent.id },
            include: [{ model: Location, as: 'location' }],
          });
          if (!locations) {
            throw new Error('Listing not found');
          }

          return locations[0]; // Return the associated locations
        } catch (error) {
          console.error('Error fetching locations:', error);
          throw new Error('Failed to fetch locations');
        }
      },
    },
  },
  AmenityCategory: {
    ACCOMMODATION_DETAILS: 'ACCOMMODATION_DETAILS',
    SPACE_SURVIVAL: 'SPACE_SURVIVAL',
    OUTDOORS: 'OUTDOORS'
  }
}

export default resolvers;