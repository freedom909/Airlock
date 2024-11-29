import mongoose from 'mongoose';
import UserRepository from '../repositories/userRepository.js';
import connectToMongoDB from './connectMongoDB.js';
import User from '../models/user.js'; // Adjust path if needed

(async () => {
    try {
        const mongodb = await connectToMongoDB();

        const userRepo = new UserRepository({ mongodb });

        // Test `save`
        const newUser = { nickname: 'testUser', email: 'test@example.com' };
        const savedUser = await userRepo.save(newUser);
        console.log('Saved User:', savedUser);

        // Test `findOne`
        const foundUser = await userRepo.findOne({ nickname: 'testUser' });
        console.log('Found User:', foundUser);

        // Test `findByIdAndUpdate`
        const updatedUser = await userRepo.findByIdAndUpdate(savedUser._id, { email: 'updated@example.com' });
        console.log('Updated User:', updatedUser);

        // Test `findByIdAndDelete`
        const deletedUser = await userRepo.findByIdAndDelete(savedUser._id);
        console.log('Deleted User:', deletedUser);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
})();