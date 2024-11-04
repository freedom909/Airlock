import mongoose from 'mongoose';
import User from '../models/user.js';  // Adjust path if needed

mongoose.connect('mongodb://localhost:27017/food');

(async () => {
    try {
        const userId = 'user-8';
        const user = await User.findOne({ id: userId }).exec();
        console.log('Fetched user:', user);
    } catch (error) {
        console.error('Error fetching user:', error);
    } finally {
        mongoose.connection.close();
    }
})();
