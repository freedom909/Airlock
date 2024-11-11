import mongoose from 'mongoose';
<<<<<<< HEAD
import Review from '../models/review.js';
import User from '../models/user.js';

mongoose.connect('mongodb://localhost:27017/air');

(async () => {
    try {
        const userId = '66dc30358791fb6291ca94d1';
        const user = await User.findOne({ _id: userId });
=======
import User from '../models/user.js';  // Adjust path if needed

mongoose.connect('mongodb://localhost:27017/food');

(async () => {
    try {
        const userId = 'user-8';
        const user = await User.findOne({ id: userId }).exec();
>>>>>>> 7208d0b14898127668337df5b09b0b6a24f868f3
        console.log('Fetched user:', user);
    } catch (error) {
        console.error('Error fetching user:', error);
    } finally {
        mongoose.connection.close();
    }
})();
