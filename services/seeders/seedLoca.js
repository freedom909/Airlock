import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import Location from '../models/location.js';
import connectToMongoDB from '../DB/connectMongoDB.js';  // Connect to MongoDB before

dotenv.config();

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'water';

const locationData = JSON.parse(readFileSync('../infrastructure/seeders/locations.json', 'utf-8'));

const seedData = async () => {
    try {
        await mongoose.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: dbName,
        });
        console.log('Connected to MongoDB');

        for (const location of locationData) {
            console.log('Seeding location:', location); // Log the location data
            const locationDoc = new Location(location);
            await locationDoc.save();
            console.log(`Location ${location.id} seeded successfully`);
        }

        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (err) {
        console.error('Error seeding data:', err);
    }
};

// Run the seeding script
seedData();
