import { DataTypes, Model } from 'sequelize';
import sequelize from './seq.js';
import ListingAmenities from './listingAmenities.js';
import Listing from './listing.js';
// Amenity model

class Amenity extends Model { }
Amenity.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
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
  modelName: 'Amenity',
  timestamps: true,
});
//Define associations
// Amenity.belongsToMany(Listing, {
//   through: ListingAmenities, // Join table
//   foreignKey: 'amenityId', // FK in ListingAmenities for Amenity
//   otherKey: 'listingId', // FK in ListingAmenities for Listings
//   as: 'listings' // Alias for reverse querying
// });

export default Amenity;

