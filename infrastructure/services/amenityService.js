import { QueryTypes } from 'sequelize';
import httpClient from '../middleware/httpClient.js';


class AmenityService {
  constructor(sequelize, httpClient) {
    this.sequelize = sequelize;
    this.httpClient = httpClient;
  }

  async getAmenityIds(amenities) {
    try {
      const response = await this.httpClient.get('/amenities', {
        params: { names: amenities },
      });
      return response.data.map((amenity) => amenity.id);
    } catch (error) {
      console.error('Error fetching amenity IDs:', error);
      throw error;
    }
  }

  async linkAmenitiesToListing(listingId, amenityIds) {
    try {
      const response = await this.httpClient.post(`/listings/${listingId}/amenities`, {
        amenities: amenityIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error linking amenities to listing:', error);
      throw error;
    }
  }

  async getAllAmenities() {
    try {
      const query = 'SELECT * FROM AMENITIES';
      const response = await this.sequelize.query(query, { type: QueryTypes.SELECT });
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid response from the database');
      }
      const amenities = response
        .map((amenity) => ({
          ...amenity,
          id: amenity.id,
          name: amenity.name,
          category: amenity.category ? amenity.category.replace(' ', '_').toUpperCase() : 'UNKNOWN',
        }))
        .filter((amenity) => amenity.name && amenity.category);
      return amenities;
    } catch (error) {
      console.error('Error fetching amenities:', error);
      throw new Error('Error fetching amenities');
    }
  }

  async getAmenityById(amenitiesId) {
    const { id } = amenitiesId;
    if (!id) {
      throw new Error('Amenity ID is required');
    }
    try {
      const query = 'SELECT * FROM AMENITIES WHERE id = :id';
      const response = await this.sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: { id },
      });
      if (!response || !Array.isArray(response) || response.length === 0) {
        throw new Error('Amenity not found');
      }
      const amenity = response[0];
      return {
        id: amenity.id,
        name: amenity.name,
        category: amenity.category ? amenity.category.replace(' ', '_').toUpperCase() : 'UNKNOWN',
      };
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
