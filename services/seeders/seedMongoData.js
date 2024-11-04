import fs from 'fs';
import path from 'path';
import connectToMongoDB from '../DB/connectMongoDB.js';
import Account from '../models/account.js';
import User from '../models/user.js';
import Profile from '../models/profile.js';
import reviews from '../models/review.js'
import mongoose from 'mongoose';

const seedAccounts = async () => {
  const accountsFilePath = path.resolve('seeders/accounts.json');
  const profilesFilePath = path.resolve('seeders/profiles.json');
  const reviewsFilePath = path.resolve('seeders/reviews.json');

  // Load data from JSON files
  const accountsData = JSON.parse(fs.readFileSync(accountsFilePath, 'utf-8'));
  const profilesData = JSON.parse(fs.readFileSync(profilesFilePath, 'utf-8'));
  const reviewsData = JSON.parse(fs.readFileSync(reviewsFilePath, 'utf-8'));

  try {
    // Establish connection to MongoDB
    await connectToMongoDB();
    console.log('Connected to MongoDB');

    // Clear existing collections
    await User.deleteMany({});
    await Account.deleteMany({});
    await Profile.deleteMany({});
    console.log('Existing data cleared!');

    for (const account of accountsData) {
      // Create user
      const user = new User({
        _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId
        name: account.name,
        email: account.email,
        password: account.password,
        nickname: account.nickname,
        role: account.role,
        picture: account.picture,
        description: account.description,
      });
      await user.save();

      // Create account associated with the user
      const newAccount = new Account({
        id: account.id,
        email: account.email,
        password: account.password,
        userId: user._id, // Associate account with user
      });
      await newAccount.save();

      // Find corresponding profile data
      const profileData = profilesData.find(profile => profile.accountId === account.id);

      // Create profile if corresponding data is found
      if (profileData) {
        const newProfile = new Profile({
          accountId: account.id,
          fullname: profileData.fullname,
          interests: profileData.interests,
          network: profileData.network,

        });
        await newProfile.save();
      }
    }

    console.log('Users, Accounts, and Profiles seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedAccounts();
