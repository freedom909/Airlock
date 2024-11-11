import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js';
import Listing from './listing.js';
import Amenity from './amenity.js';
import Location from './location.js';

class ListingAmenities extends Model { }

ListingAmenities.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amenityId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'ListingAmenities', // Explicit model name
  timestamps: true,
});

// Define the many-to-many relationship between Listing and Amenity



// Define the many-to-many relationship between Listing and Amenity


export default ListingAmenities;
