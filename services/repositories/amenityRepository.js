import Amenity from '../models/amenity.js';
import ListingAmenities from '../models/listingAmenities.js';

class AmenityRepository {
  async findAmenitiesByName(amenities) {
    return await Amenity.findAll({
      where: {
        [Op.in]: amenities, // Sequelize "in" operator to handle array
      },
      attributes: ['id'],
    });
  }

  async createAmenity(amenity) {
    return await Amenity.create(amenity);
  }

  async findAllAmenities() {
    return await Amenity.findAll();
  }

  async bulkCreateListingAmenities(listingAmenities) {
    return await ListingAmenities.bulkCreate(listingAmenities);
  }
}

export default new AmenityRepository();
