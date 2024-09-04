import { AuthenticationError, ForbiddenError } from '../infrastructure/utils/errors.js';
import { permissions } from '../infrastructure/auth/permission.js';
import Listing from '../infrastructure/models/listing.js';
import Coordinate from '../infrastructure/models/coordinate.js';

const { listingWithPermissions, isHostOfListing, isAdmin } = permissions;


// import { searchListings } from '../infrastructure/search/searchData.js';

import { searchListings } from '../infrastructure/search/searchData.js';

// const client = new Client({ host: 'http://localhost:9200' })

const resolvers = {

  Query: {
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
          include: [{
            model: Coordinate,
            as: 'coordinate', // Ensure this alias matches your model association
          }],
        });
        if (!listings) {
          throw new Error('No listings found');
        }

        return listings.map(listing => ({
          ...listing.toJSON(),
          checkInDate: new Date(listing.checkInDate).toISOString(),
          checkOutDate: new Date(listing.checkOutDate).toISOString(),
        }));
      } catch (error) {
        throw new Error('Failed to fetch listings');
      }

    },

    listing: async (_, { id }, { dataSources }) => {
      try {
        const listing = await Listing.findOne({
          where: { id },
          include: [{
            model: Coordinate,
            as: 'coordinate',
          }],
        });
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

    // featuredListings: async (_, __, { dataSources }) => {
    //   const { listingService } = dataSources;
    //   const limit = 3;
    //   return await listingService.getFeaturedListings(limit);
    // },

    featuredListings: async () => {
      // Fetch featured listings with coordinates
      return await Listing.findAll({
        where: { isFeatured: true }, // Assuming you have a field to filter featured listings
        include: [{ model: Coordinate, as: 'coordinate' }], // Include coordinates
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

    amenities: (_, __, { dataSources }) => {
      const { listingService } = dataSources;
      return listingService.getAllAmenities();
    },
    searchListings: async (_, { criteria }, { dataSources }) => {
      try {
        const { listingService, bookingService } = dataSources;
        const { numOfBeds, reservedDate, page, limit, sortBy } = criteria;
        const { checkInDate, checkOutDate } = reservedDate;
        const listings = await listingService.searchListings({
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
      // if (!userId) throw new AuthenticationError('User not authenticated');
      // if (!isHostOfListing || !isAdmin) {
      //   throw new AuthenticationError(`you don't have right to delete this list`)
      // }
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
      if (!userId) throw new AuthenticationError('User not authenticated');
      if (!listingWithPermissions) {
        throw new AuthenticationError('User does not have permissions to create a listing');
      }

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
      if (!userId) throw new AuthenticationError('User not authenticated');
      if (!listingWithPermissions) {
        throw new AuthenticationError('User does not have permissions to create a listing');
      }
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

    searchListings: async (_, { criteria }) => {
      try {
        const results = await searchListings('listings_index', criteria);
        return results;
      } catch (error) {
        throw new Error(`Failed to search listings: ${error.message}`);
      }
    }
  },

  createListing: async (_, { listing }, { dataSources, userId }) => {
    if (!userId) throw new AuthenticationError('User not authenticated');
    if (!listingWithPermissions) {
      throw new AuthenticationError('User does not have permissions to create a listing');
    }

    const { listingService, amenityService } = dataSources;
    const { amenities } = listing;
    if (!amenities || !amenities.length) {
      throw new Error('Listing must have at least one amenity');
    }
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
    if (!userId) throw new AuthenticationError('User not authenticated');
    if (!isHostOfListing || !isAdmin) {
      throw new AuthenticationError(`you don't have right to update this list`)
    }
    const { listingService } = dataSources;

    if (!listingId) throw new Error('Listing ID not provided');
    try {
      const updatedListing = await listingService.updateListing({ ...listing, id: listingId });
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


  Listing: {
    __resolveReference: async ({ id }, { dataSources }) => {
      const { listingService } = dataSources;
      return await listingService.getListing(id);
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
    bookings: ({ id }, _, { dataSources }) => {
      const { bookingService } = dataSources;
      return bookingService.getBookingsForListing(id);
    },
    numberOfUpcomingBookings: async ({ id }, _, { dataSources }) => {
      const { bookingService } = dataSources;
      const bookings = await bookingService.getBookingsForListing(id, 'UPCOMING') || [];
      return bookings.length;
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