

import { Model, DataTypes } from 'sequelize';
import sequelize from './seq.js'; // Adjust the path as necessary
import Location from './location.js';
import Amenity from './amenity.js';
import ListingAmenities from './listingAmenities.js';
class Listing extends Model { }

Listing.init({
  id: {

    type: DataTypes.UUID,         // Use UUID as the ID type
    defaultValue: DataTypes.UUIDV4,      // Automatically generate UUID for new records
    primaryKey: true,
  },

  locationId: {
    type: DataTypes.UUID,         // Use UUID as the ID type
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  costPerNight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  hostId: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  numOfBeds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  pictures: {
    type: DataTypes.JSON, // Store array of picture URLs
    allowNull: false,
    defaultValue: ["pic1.jpg", "pic2.jpg"]
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  saleAmount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  bookingNumber: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  listingStatus: {
    type: DataTypes.ENUM('ACTIVE', 'PENDING', 'SOLD', 'DELETED', 'REJECT', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'AVAILABLE', 'PUBLISHED'),
    allowNull: false,
  },
  locationType: {
    type: DataTypes.ENUM('SPACESHIP', 'HOUSE', 'CAMPSITE', 'APARTMENT', 'ROOM'),
    allowNull: false,
    defaultValue: 'ROOM', // Add a default value
  },
}, {
  sequelize,
  modelName: 'Listing',

  timestamps: false,

});

// Defining associations
Listing.associate = (models) => {
  Listing.hasMany(models.Booking, { foreignKey: 'listingId', as: 'bookings' });
  Listing.belongsToMany(models.Amenity, { through: 'ListingAmenities', foreignKey: 'listingId', as: 'amenities' });

  Listing.belongsTo(Location, { as: 'location', foreignKey: 'locationId' });

  // Location model
  // Location model
  Location.hasOne(Listing, { as: 'listing', foreignKey: 'locationId' });
};

export default Listing;

Listing.hasOne(Location, {
  foreignKey: 'listingId', // Foreign key in the Location model
  as: 'location', // Alias should reflect a collection of locations
});
Location.belongsTo(Listing, {
  foreignKey: 'listingId', // Foreign key in the Location model
  as: 'location', // This alias must match the association in Listing
});
// Define the many-to-many relationship

//Listing.belongsToMany(Amenity, { through: ListingAmenities, foreignKey: 'listingId', otherKey: 'amenityId', as: 'amenities' });
//Amenity.belongsToMany(Listing, { through: ListingAmenities, foreignKey: 'amenityId', otherKey: 'listingId', as: 'listings' });

