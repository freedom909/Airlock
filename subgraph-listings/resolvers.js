import { AuthenticationError, ForbiddenError } from '../infrastructure/utils/errors.js';
import { permissions } from '../infrastructure/auth/permission.js';
import Listing from '../services/models/listing.js';
import Coordinate from '../services/models/location.js';
import dbConfig from '../services/DB/dbconfig.js';
import Location from '../services/models/location.js';
import { GraphQLError } from 'graphql';
import Amenity from '../services/models/amenity.js';
import { Op } from '@sequelize/core'
import calculateDistance from './calculateDistance.js';
const { listingWithPermissions, isHostOfListing, isAdmin } = permissions;


// import { searchListings } from '../infrastructure/search/searchData.js';

// import { searchListings } from '../infrastructure/search/searchData.js';

// const client = new Client({ host: 'http://localhost:9200' })

const resolvers = {

  Query: {
    getNearbyListings: async (_, { latitude, longitude, radius }, { dataSources }) => {
      if (!latitude || !longitude) throw new Error('You must provide a latitude and longitude');
      const { listingService } = dataSources;

      try {
        const nearbyListings = await listingService.getNearbyListings(latitude, longitude, radius);
        console.log('Nearby Listings fetch result:', JSON.stringify(nearbyListings, null, 2));

        // Map the output to ensure it contains every required field  
        const mappedListings = nearbyListings.map(listing => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          pictures: listing.pictures,
          numOfBeds: listing.numOfBeds,
          costPerNight: listing.costPerNight,
          isFeatured: listing.isFeatured !== null ? listing.isFeatured : false,
          saleAmount: listing.saleAmount,
          checkInDate: listing.checkInDate || "default_check_in_date", // Ensure a valid default  
          checkOutDate: listing.checkOutDate || "default_check_out_date", // Ensure a valid default  
          // Add remaining fields required by your schema  
          location: null, // Default or fetch the location object as needed  
          host: null, // Default or fetch the host object as needed  
          amenities: [], // Default or fetch the amenities array as needed  
          numberOfUpcomingBookings: 0, // Default, if not present  
          currentlyBookedDates: [], // Default, if not present  
          listingStatus: null, // Define the value based on your needs  
          bookings: [], // Default or fetched bookings array  
          availability: [], // Default or fetched availability  
          priceRange: null, // Must conform to your schema requirements  
          totalCostRange: null, // Must conform to your schema requirements  
          locationFilter: null, // Must conform to your schema requirements  
        }));
        const refinedListings = mappedListings
          .filter(listing => listing.title && listing.id) // Ensuring essential fields are present  
          .map(listing => ({
            id: listing.id,
            title: listing.title,
            description: listing.description ?? "No description available", // Default placeholder  
            pictures: listing.pictures ?? [],
            numOfBeds: listing.numOfBeds ?? 0,
            costPerNight: listing.costPerNight ?? 0,
            isFeatured: listing.isFeatured ?? false,
            saleAmount: listing.saleAmount ?? 0,
            checkInDate: listing.checkInDate ?? "default_check_in_date",
            checkOutDate: listing.checkOutDate ?? "default_check_out_date",
            // Optionally include location, host, etc. based on your needs  
          }));
        // Log the mapped output for verification  
        console.log('Mapped Listings for GraphQL response:', JSON.stringify(mappedListings, null, 2));
        return refinedListings;
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

    amenities: async (listing, _, { dataSources }) => {
      const { listingService } = dataSources;
      const amenities = await listingService.getAmenitiesForListing(listing.id);
      console.log(`Amenities for listing ${listing.id}:`, amenities);  // Debug log
      return amenities;
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
    createListing: async (_, { input }, { dataSources, userId }) => {
      // if (!userId) throw new AuthenticationError('User not authenticated');
      // if (!listingWithPermissions) {
      //   throw new AuthenticationError('User does not have permissions to create a listing');
      // }

      const { listingService, amenityService } = dataSources;
      const { status = "PENDING", ...listingInput } = input;
      const { amenities } = listingInput;
      if (!amenities || !amenities.length) {
        throw new Error('Listing must have at least one amenity');
      }
      const amenityIds = await amenityService.getAmenityIds(amenities);
      // Prepare the listing object to be created
      const listing = { ...listingInput, status, amenities: amenityIds, hostId: userId };

      try {
        const newListing = await listingService.createListing(listing);
        await amenityService.linkAmenitiesToListing(newListing.id, amenityIds);
        return {
          code: 200,
          success: true,
          message: 'Listing successfully created!',
          listing: newListing
        };
      } catch (err) {
        console.error(err);
        return {
          code: 400,
          success: false,
          message: err.message
        };
      }
    },

    updateListingStatus: async (_, { input }, { dataSources }) => {
      // if (!userId) throw new AuthenticationError('User not authenticated');
      // if (!listingWithPermissions) {
      //   throw new AuthenticationError('User does not have permissions to create a listing');
      // }
      const { id, listingStatus } = input;
      console.log('Input received:', input);

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

    createListing: async (_, { input }, { dataSources, userId }) => {
      // if (!userId) throw new AuthenticationError('User not authenticated');
      // if (!listingWithPermissions) {
      //   throw new AuthenticationError('User does not have permissions to create a listing');
      // }
      console.log("Received listing data:", input); // Received listing data: undefined
      if (!input || !input.listing) {
        throw new Error("Listing data is required");
      }
      const { listing } = input; // Destructure listing from input
      if (!listing.title || !listing.price || !listing.numOfBedrooms || !listing.location) {
        throw new Error('Title, price, number of bedrooms, and city are required');
      }
      const { checkInDate, checkOutDate } = listing; // Destructure check-in and check-out dates from listing
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn.getTime() < checkOut.getTime()) {
        throw new Error('Invalid check-in or check-out date format');
      }


      const { listingService, amenityService } = dataSources;
      const { amenities = [] } = listing;
      // Prepare the listing object to be created
      const listingData = { ...listing, hostId: userId };
      // Prepare the listing object to be created
      const newListing = await listingService.createListing(listingData);
      // Link amenities to the listing

      //const amenityIds = await amenityService.getAmenityIds(amenities);
      //await amenityService.linkAmenitiesToListing(newListing.id, amenityIds);

      //const amenityIds = await amenityService.getAmenityIds(amenities);
      // Prepare the listing object to be created
      //const listing = {...listing, hostId: userId, amenities: amenityIds };

      //const { amenities = [] } = listing;  // Destructure amenities from listing

      //if (!amenities ||!amenities.length) {
      //throw new Error('Listing must have at least one amenity');
      //}
      //const amenityIds = await amenityService.getAmenityIds(amenities);
      // Prepare the listing object to be created
      //const listing = {...listing, hostId: userId, amenities: amenityIds };
      //if (!amenities || !amenities.length) {
      //throw new Error('Listing must have at least one amenity');
      //}
      const amenityIds = await amenityService.getAmenityIds(amenities);
      listing.amenities = amenityIds;
      try {
        const newListing = await listingService.createListing({ ...listing, hostId: userId });
        await amenityService.linkAmenitiesToListing(newListing.id, amenityIds);
        return {
          code: 200,
          success: true,
          message: 'Listing successfully created!',
          listing: newListing
        };
      } catch (err) {
        console.error(err);
        return {
          code: 400,
          success: false,
          message: err.message
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
    coordinates: async (parent, _, { dataSources }) => {
      // Use eager loading to fetch coordinates when fetching listings
      const listingWithCoordinates = await Listing.findOne({
        where: { id: parent.id },
        include: [{ model: Coordinate, as: 'coordinate' }],
      });

      // Return the associated coordinates
      return listingWithCoordinates?.coordinates || null;
    },
  },

  AmenityCategory: {
    ACCOMMODATION_DETAILS: 'ACCOMMODATION_DETAILS',
    SPACE_SURVIVAL: 'SPACE_SURVIVAL',
    OUTDOORS: 'OUTDOORS'
  }
}

export default resolvers;