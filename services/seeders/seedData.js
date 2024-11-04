import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from '../models/seq.js';
import Listing from '../models/listing.js';
import Booking from '../models/booking.js';
import Payment from '../models/payment.js';
import Amenity from '../models/amenity.js';
//import Coordinate from '../models/coordinate.js';
import ListingAmenities from '../models/listingAmenities.js';
import Location from '../models/location.js'; // Ensure this model exists and is imported correctly

const models = { Listing, Booking, Payment, Amenity, ListingAmenities, Location };

async function loadJSON(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function seedModel(model, data) {
  for (const item of data) {
    await model.create(item);
  }
}

async function seedDatabase() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  try {
    await sequelize.sync({ force: true });
    console.log('Database synced!');

    // const locations = await loadJSON(path.join(__dirname, 'locations.json'));
    const listings = await loadJSON(path.join(__dirname, 'listings.json'));
    //const coordinates = await loadJSON(path.join(__dirname, 'coordinates.json'));
    const bookings = await loadJSON(path.join(__dirname, 'bookings.json'));
    const payments = await loadJSON(path.join(__dirname, 'payments.json'));
    const amenities = await loadJSON(path.join(__dirname, 'amenities.json'));
    const listingAmenities = await loadJSON(path.join(__dirname, 'listingAmenities.json'));
    const locations = await loadJSON(path.join(__dirname, 'locations.json'));

    // await seedModel(Location, locations);
    await seedModel(Listing, listings);
    // await seedModel(Coordinate, coordinates);
    await seedModel(Booking, bookings);
    await seedModel(Payment, payments);
    await seedModel(Amenity, amenities);
    await seedModel(ListingAmenities, listingAmenities);
    await seedModel(Location, locations);  // Ensure this model exists and is imported correctly

    console.log('Data seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();