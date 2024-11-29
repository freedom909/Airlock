import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.js';  // Adjust the path as necessary
import fs from 'fs/promises';

import { fileURLToPath } from 'url';

dotenv.config();

const models = { User };

async function loadJSON(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

const mongoUrl = 'mongodb://localhost:27017/food';


const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing user data');

    // Define the partial index here, if not in model
    User.schema.index({ providerId: 1 }, { unique: true, partialFilterExpression: { providerId: { $type: "string" } } });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const userData = await loadJSON(path.join(__dirname, 'users.json'));

    // Insert new data
    await User.insertMany(userData);
    console.log('Inserted user data');

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    mongoose.disconnect();
  }
};



seedDatabase();
