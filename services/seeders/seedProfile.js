import mongoose from 'mongoose';
import Profile from '../models/profile.js';


import dotenv from 'dotenv';

dotenv.config();
const url='mongodb://localhost:27017/air'||process.env.MONGODB_URL;


const mockData = [
  {
    accountId: "12345",
    fullname: "John Doe",
    createdAt: new Date("2023-01-01"),
    interests: ["reading", "traveling", "music"],
    network: ["friend1", "friend2"],
    username: "johndoe"
  },
  {
    accountId: "12346",
    fullname: "Jane Smith",
    createdAt: new Date("2023-01-02"),
    interests: ["cooking", "yoga"],
    network: ["friend3", "friend4"],
    username: "janesmith"
  },
  {
    accountId: "12347",
    fullname: "Alice Johnson",
    createdAt: new Date("2023-01-03"),
    interests: ["photography", "running"],
    network: ["friend5"],
    username: "alicej"
  },
  {
    accountId: "12348",
    fullname: "Bob Brown",
    createdAt: new Date("2023-01-04"),
    interests: ["gaming", "coding"],
    network: ["friend6", "friend7", "friend8"],
    username: "bobbrown"
  },
  {
    accountId: "12349",
    fullname: "Charlie Davis",
    createdAt: new Date("2023-01-05"),
    interests: ["hiking", "movies"],
    network: ["friend9"],
    username: "charlied"
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(url);

    await Profile.deleteMany({}); // Clear existing data
    await Profile.insertMany(mockData); // Insert mock data

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();

