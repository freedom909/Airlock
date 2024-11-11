import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.js';  // Adjust the path as necessary
<<<<<<< HEAD
// import usersData from './users.json' assert { type: "json"};  // Adjust the path as necessary

dotenv.config();
const usersData=
[
    {
      "id": "user-1",
      "name": "Eves",
      "email":"email1@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick1",
      "role": "HOST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-1.png",
      "description": "I've been to 15 different planets and decided to make a home for myself and others in my favourites. Each planet and location has its own distinct environment, so read the description carefully. I have equipped them all with the necessary amenities."
    },
    {
      "id": "user-2",
      "name": "Jackenn",
      "email":"email2@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick2",
      "role": "GUEST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-2.png",
      "description": "Not a guest feature yet."
    },
    {
      "id": "user-3",
      "name": "Athes",
      "email":"email3@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick3",
      "role": "GUEST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-3.png",
      "description": "Not a guest feature yet."
    },
    {
      "id": "user-4",
      "name": "Kelle",
      "email":"email14@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick4",
      "role": "HOST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-4.png",
      "description": "So excited to have you! I'm readily available if you need anything, from missing bath towels to local food recommendations. Have an awesome time!"
    },
    {
      "id": "user-5",
      "name": "Renie",
      "email":"email15@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick5",
      "role": "HOST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-5.png",
      "description": "You won't regret staying at my place! My listings get booked up quickly so better get to it!"
    },
    {
      "id": "user-6",
      "name": "Flinson",
      "email":"email6@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick6",
      "role": "HOST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-6.png",
      "description": "I'm new at this, please be nice."
    },
    {
      "id": "user-7",
      "name": "Cara",
      "email":"email7@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick7",
      "role": "GUEST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-7.png",
      "description": "Not a guest feature yet."
    },
    {
      "id": "user-8",
      "name": "Wardy",
      "email":"email8@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick8",
      "role": "GUEST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-8.png",
      "description": "Not a guest feature yet."
    },
    {
      "id": "user-9",
      "name": "Brise",
      "email":"email9@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick9",
      "role": "GUEST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-9.png",
      "description": "Not a guest feature yet."
    },
    {
      "id": "user-10",
      "name": "Hendav",
      "email":"email10@gmail.com",
      "password":"#Pdfd343.P",
      "nickname":"nick10",
      "role": "GUEST",
      "picture": "https://res.cloudinary.com/apollographql/image/upload/odyssey/airlock/user-10.png",
      "description": "Not a guest feature yet."
    }
  ]
  
async function loadJSON(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

const mongoUrl =  'mongodb://localhost:27017/air';


const seedDatabase = async () => {
    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        console.log('Cleared existing user data');

        // Insert new data
        await User.insertMany(usersData);
        console.log('Inserted user data');

        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error seeding database:', error);
        mongoose.disconnect();
    }
};

=======
import fs from 'fs/promises';

import { fileURLToPath } from 'url';

dotenv.config();

const models = { User };

async function loadJSON(filePath) {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

const mongoUrl = 'mongodb://localhost:27017/water';


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


>>>>>>> 7208d0b14898127668337df5b09b0b6a24f868f3
seedDatabase();
