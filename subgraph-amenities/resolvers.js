

const resolvers = {
  Query: {
    listings: async (_, __, { dataSources }) => {
      const { listingService } = dataSources;
      return await listingService.getAllListings();
    },
    listing: async (_, { id }, { dataSources }) => {
      const { listingService } = dataSources;
      return await listingService.getListingById(id);
    },

    amenities: async (_, __, { dataSources }) => {
      const { amenityService } = dataSources; //   "TypeError: Cannot destructure property 'amenityService' of 'dataSources' as it is undefined.",
      return await amenityService.getAllAmenities();
    },
    amenity: async (_, { id }, { dataSources }) => {
      const { amenityService } = dataSources;
      return await amenityService.getAmenityById(id);
    },
  },
  Mutation: {
    addAmenity: async (_, { name }, { dataSources }) => {
      const { amenityService } = dataSources;
      return amenityService.addAmenity(name, categoryId)
    },
    addAmenityToListing: async (_, { listingId, amenityId }, { dataSources }) =>
      dataSources.listingService.addAmenityToListing(listingId, amenityId),
  },
  Amenity: {
    __resolveReference: async (reference, { dataSources }) => {
      return await dataSources.amenityService.getAmenityById(reference.id);
    },
  },
  Listing: {
    __resolveReference: async (reference, { dataSources }) => {
      return await dataSources.listingService.getListingById(reference.id);
    },
    amenities: async (listing, __, { dataSources }) => dataSources.amenityService.getAmenitiesById(listing.amenityIds),
  },
};
export default resolvers;