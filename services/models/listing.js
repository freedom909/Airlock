import { Model, DataTypes, ENUM } from 'sequelize';
import sequelize from './seq.js'; // Adjust the path as necessary
import Location from './location.js'; // Import Coordinate model
import Amenity from './amenity.js';
import ListingAmenities from './listingAmenities.js';
import Coordinate from './coordinate.js'; // Import Coordinate model

class Listing extends Model { }

Listing.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  costPerNight: DataTypes.FLOAT,
  hostId: DataTypes.STRING,
  locationType: DataTypes.STRING,
  numOfBeds: DataTypes.INTEGER,
  photoThumbnail: DataTypes.STRING,
  isFeatured: DataTypes.BOOLEAN,
  saleAmount: DataTypes.FLOAT,
  bookingNumber: DataTypes.INTEGER,
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  checkInDate: DataTypes.DATE,
  checkOutDate: DataTypes.DATE,
  locationId: {  // Add this field
    type: DataTypes.STRING,
    allowNull: true,  // If locationId is mandatory, else allowNull: true
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',  // If a location is deleted, set locationId to NULL
  },
  // listingAmenitiesId: DataTypes.STRING,
  totalCost: {
    type: DataTypes.VIRTUAL,
    get() {
      const checkIn = new Date(this.checkInDate);
      const checkOut = new Date(this.checkOutDate);
      const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      return this.costPerNight * numberOfNights;
    }
  },
  listingStatus: {
    type: DataTypes.ENUM,
    values: ['ACTIVE', 'PENDING', 'SOLD', 'DELETED', 'REJECT', 'CANCELLED', 'EXPIRED', 'COMPLETED'],
    set(value) {
      // Log the value to ensure it's being set
      console.log(`Setting listingStatus to: ${value}`);

      // Add any custom logic before setting the value
      if (this.isFeatured && value === 'SOLD') {
        throw new Error('Featured listings cannot be set to SOLD.');
      }

      // Set the value using the default setter
      this.setDataValue('listingStatus', value);
    }
  },
}, {
  sequelize,
  modelName: 'Listing',
  timestamps: true,
});

// Listing.hasOne(Coordinate, { foreignKey: 'listingId', as: 'coordinate' });
// //Define the one-to-one relationship

// Coordinate.belongsTo(Listing, {
//   foreignKey: 'listingId',
//   as: 'coordinate', // Alias must match the Listing model association
// });

Listing.hasOne(Location, {
  foreignKey: 'listingId', // Foreign key in the Location model
  as: 'location', // Alias should reflect a collection of locations
});
Location.belongsTo(Listing, {
  foreignKey: 'listingId', // Foreign key in the Location model
  as: 'location', // This alias must match the association in Listing
});
// Define the many-to-many relationship

Listing.belongsToMany(Amenity, { through: ListingAmenities, foreignKey: 'listingId', otherKey: 'amenityId', as: 'amenities' });
Amenity.belongsToMany(Listing, { through: ListingAmenities, foreignKey: 'amenityId', otherKey: 'listingId', as: 'listings' });

// Export the model
export default Listing;


