// services/amenityService.js
import { QueryTypes } from 'sequelize';
import Amenity from '../models/amenity.js'; // Assuming you have an Amenity model
import { CanceledError } from 'axios';

class AmenityService {
  constructor({ sequelize }) {
    this.sequelize = sequelize;
    // this.httpClient = httpClient;
    // this.Amenity = Amenity;
  }

  async getAllAmenities() {
    try {
      const query = 'SELECT * FROM AMENITIES';
      const response = await this.sequelize.query(query, { type: QueryTypes.SELECT });
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response from the database');
      }
      const amenities = response.map((amenity) => ({
        ...amenity,
        id: amenity.id,
        name: amenity.name,
        category: amenity.category ? amenity.category.replace(' ', '_').toUpperCase() : 'UNKNOWN',
      })).filter((amenity) => amenity.name && amenity.category);
      return amenities;
    } catch (error) {
      console.error('Error fetching amenities:', error);
      throw new Error('Error fetching amenities');
    }
  }

  async getAmenityById(id) {
    try {
      const amenity = await this.Amenity.findByPk(id);
      if (!amenity) {
        throw new Error('Amenity not found');
      }
      return amenity;
    } catch (error) {
      console.error('Error fetching amenity:', error);
      throw new Error('Error fetching amenity');
    }
  }

  async addAmenity(name, categoryId) {
    if (!name) {
      throw new Error('Amenity name is required');
    }
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    try {
      const category = await this.sequelize.models.Category.findByPk(categoryId);
      if (!category) {
        throw new Error('Invalid category ID');
      }
      const existingAmenity = await this.sequelize.models.Amenity.findOne({
        where: { name, categoryId },
      });
      if (existingAmenity) {
        throw new Error('Amenity already exists');
      }
      const amenity = await this.sequelize.models.Amenity.create({ name, categoryId });
      return amenity;
    } catch (error) {
      console.error('Error adding amenity:', error);
      throw new Error('Failed to add amenity');
    }
  }

  async getAmenityIds(amenities) {
    if (!amenities || !Array.isArray(amenities)) {
      throw new Error('Invalid amenities array');
    }

    const amenityIds = await Promise.all( //Error: Column 'id' cannot be null
      amenities.map(async (amenity) => {
        const { name, category, description } = amenity;
        if (!name || !category) {
          throw new Error('Missing name or category in amenity');
        }
        const [amenityRecord] = await this.sequelize.models.Amenity.findOrCreate({
          where: { name, category: category.replace(' ', '_').toUpperCase(), description },
          defaults: {
            name: name,
            category: category.replace(' ', '_').toUpperCase(),
            description,
          },
        });
        console.log(amenityRecord.id);
        return amenityRecord.id;
      })
    );

    return amenityIds;
  }


  async linkAmenitiesToListing(listingId, amenityIds) {
    // Construct an array of objects to insert into ListingAmenities
    const listingAmenitiesData = amenityIds.map(amenityId => ({
      listingId,
      amenityId,
    }));

    // Insert the records using bulkCreate
    try {
      await ListingAmenities.bulkCreate(listingAmenitiesData);
      console.log('Amenities linked to listing successfully.');
    } catch (error) {
      console.error('Error linking amenities to listing:', error);
      throw new Error('Error linking amenities to listing.');
    }
  }

  async getAmenitiesByListingId(listingId) {
    if (!listingId) {
      throw new Error('Listing ID is required');
    }
    try {
      const listing = await this.sequelize.models.Listing.findByPk(listingId, {
        include: this.sequelize.models.Amenity,
      });
      return listing ? listing.Amenities : [];
    } catch (error) {
      console.error('Error fetching amenities for listing:', error);
      throw new Error('Failed to fetch amenities for listing');
    }
  }
}

export default AmenityService;
