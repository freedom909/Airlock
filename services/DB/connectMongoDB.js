import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'air';
console.log('MONGODB_URI:', mongoUri);
console.log('DB_NAME:', dbName);

let isConnected = false;

async function connectToMongoDB() {
    if (!isConnected) {
        try {
            // Correctly setting the URI to include the database name  
            await mongoose.connect(mongoUri + '/' + dbName);
            isConnected = true;
            console.log('Connected to MongoDB with Mongoose');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error; // Rethrow the error to handle it in the caller function  
        }
    }
}

export default connectToMongoDB;