import sequelize from './seq.js';
import User from './user.js';
import Account from './account.js';
import Listing from './listing.js';
import Review from './review.js';
// import ReviewOfGuest from './reviewOfGuest.js';
// import ReviewOfHost from './reviewOfHost.js';
import Booking from './booking.js';
import Payment from './payment.js';
import Amenity from './amenity.js';
import ListingAmenities from './listingAmenities.js';

import Location from './location.js';


// Define associations
const models = { User, Account, Listing, Review, Booking, Payment, Amenity, ListingAmenities, Location };

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Define associations
// Listing.hasOne(Coordinate, { foreignKey: 'listingId', as: 'coordinate' });
Listing.hasOne(Location, { foreignKey: 'listingId', as: 'location' });
Location.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

// Sync database
(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced!');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
})();
export default models;

// import { Sequelize } from 'sequelize';
// // Similarly, ensure other models are properly imported

// const sequelize = new Sequelize(process.env.MYSQL_DATABASE_URL); // Your MySQL connection string

// const models = {
//   Listing: init(sequelize), // Initialize the model with the Sequelize instance
//   Booking: init(sequelize), // Repeat for other models
//   sequelize, // Include the Sequelize instance if needed for transactions, etc.
// };

// export default models; // Export the models object
