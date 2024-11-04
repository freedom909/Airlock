import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import sequelize from '../models/seq.js'; // Your Sequelize instance
import Location from '../models/location.js'; // Your Sequelize Location model

dotenv.config();

const locations = JSON.parse(readFileSync('../infrastructure/seeders/locations.json', 'utf-8'));

async function seedLocations() {
    try {
        // Connect to MySQL using Sequelize
        await sequelize.authenticate();
        console.log('Connected to MySQL with Sequelize');

        // Iterate over the locations data and upsert each one
        for (const locationData of locations) {
            await Location.upsert({
                listingId: locationData.listingId,   // Find by listingId (unique key)
                name: locationData.name,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                radius: locationData.radius,
                address: locationData.address,
                city: locationData.city,
                state: locationData.state,
                country: locationData.country,
                zipCode: locationData.zipCode
            });
        }

        console.log('Location data seeded successfully');
        await sequelize.close(); // Close the MySQL connection
    } catch (error) {
        console.error('Error seeding data:', error);
    }
}

seedLocations();
