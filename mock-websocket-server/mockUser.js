import UserService from '../services/userService.js'; // Adjust the path as necessary  

// Mock implementation of UserService  
import connectToMongoDB from '../../services/DB/connectMongoDB.js'; // Ensure correct path
import UserRepository from '../../services/repositories/userRepository.js';

describe('UserRepository Tests', () => {
    let mongodb;
    let userRepo;

    beforeAll(async () => {
        // Establish connection to MongoDB
        mongodb = await connectToMongoDB();
        userRepo = new UserRepository({ mongodb });
    });

    afterAll(async () => {
        // Close MongoDB connection after tests
        await mongodb.client.close();
    });

    test('should save a user to the database', async () => {
        const newUser = { nickname: 'testUser', email: 'test@example.com' };
        const savedUser = await userRepo.save(newUser);
        expect(savedUser).toHaveProperty('_id');
        expect(savedUser.nickname).toBe('testUser');
    });

    test('should find a user by nickname', async () => {
        const foundUser = await userRepo.findOne({ nickname: 'testUser' });
        expect(foundUser).not.toBeNull();
        expect(foundUser.nickname).toBe('testUser');
    });

    // Add more tests as needed
});

