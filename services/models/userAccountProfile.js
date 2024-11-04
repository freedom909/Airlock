// Import sequelize and models
import sequelize from './seq.js';
import User from './user.js';
import Account from './account.js';
import Profile from './profile.js';

// Initialize models
const models = { User, Account };

// Function to find Account and related User
const findAccountWithUser = async (accountId) => {
  try {
    // Find Account by accountId
    const account = await Account.findByPk(accountId);
    if (account) {
      // Find User by userId in MongoDB
      const user = await User.findOne({ _id: account.userId });
      if (user) {
        // Return Account with User
        return { ...account.toJSON(), user };
      } else {
        throw new Error('User not found');
      }
    }
  } catch (error) {
    throw new Error('Error finding Account with User');
  }
}

const findProfileWithAccount = async (accountId) => {
  try {
    // Find Account by accountId in MySQL
    const account = await Account.findByPk(accountId);
    
    if (!account) {
      throw new Error('Account not found');
    }

    // Find Profile by profileId in MongoDB
    const profile = await Profile.findOne({ _id: account.profileId });
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Combine Account data with Profile data
    return { ...account.toJSON(), profile: profile.toObject() };

  } catch (error) {
    throw new Error(`Error finding Account with Profile: ${error.message}`);
  }
};


// Sync database
(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced!');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
})();
export { findAccountWithUser,findProfileWithAccount  };
