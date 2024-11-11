import { Model, DataTypes, ENUM } from 'sequelize';
import sequelize from '../../models/seq.js'; // Adjust the path as necessary  
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Listing from '../../models/listing.js'
import Amenity from '../../models/amenity.js'; //
import ListingAmenities from '../../models/listingAmenities.js';
import Location from '../../models/location.js'
const seedData = async () => {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        // Define the path to the location.json file  
        const filePath = path.join(__dirname, 'data.json'); // Adjust the path as necessary  

        // Read the JSON file  
        const data = fs.readFileSync(filePath, 'utf8');
        // Parse the JSON data  
        const { listings, amenities, listingAmenities, locations } = JSON.parse(data);
        await sequelize.sync(); // This will create the table  

        // Insert data into the database  
        await Listing.bulkCreate(listings);
        await Amenity.bulkCreate(amenities);
        await Location.bulkCreate(locations);
        console.log('Locations inserted successfully!');
        await ListingAmenities.bulkCreate(listingAmenities);
        console.log('Data inserted successfully!');
    } catch (error) {
        console.error('Error inserting locations:', error);
    }
};
await seedData();
