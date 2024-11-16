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
    type: DataTypes.UUID,
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


export default ListingAmenities;
