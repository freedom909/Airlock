import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME;
console.log('MONGODB_URL:', mongoUrl);
console.log('DB_NAME:', dbName);

let isConnected = false;

async function connectToMongoDB() {
    if (!isConnected) {
        try {
            // Connect to MongoDB with Mongoose
            await mongoose.connect(mongoUrl, {

                dbName: dbName,
            });
            isConnected = true;
            console.log('Connected to MongoDB with Mongoose');
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error; // Rethrow the error to handle it in the caller function
        }
    }
}

export default connectToMongoDB;
