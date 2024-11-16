import UserService from '../services/userService.js'; // Adjust the path as necessary  

// Mock implementation of UserService  
jest.mock('./userService');

describe('Listing Creation', () => {
    const mockUser = {
        id: 'host-12',
        name: 'Host Name',
        picture: 'https://example.com/picture.jpg',
        nickname: 'Hosty',
        role: 'HOST',
        provider: 'LOCAL',
        description: 'A friendly host.',
    };

    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:  
        UserService.mockClear();

        // Mock the findUserById method to return our mock user  
        UserService.prototype.findUserById = jest.fn(async (id) => {
            if (id === 'host-12') {
                return mockUser; // Return our mock user  
            }
            return null; // Return null for any other ID  
        });
    });

    it('should create a listing for a valid host', async () => {
        // Arrange: Set up your input data for listing creation  
        const input = {
            description: 'good',
            pictures: ['2.JPEG'],
            costPerNight: 2,
            locationType: 'ROOM',
            listingStatus: 'PENDING',
            title: 'hou',
            price: 111,
            numOfBeds: 2,
            checkInDate: '2024-11-11',
            checkOutDate: '2024-11-12',
            hostId: 'host-12',
            locationId: '129b855a-69ba-457c-acb0-779111553d35',
        };

        // Act: Run the function you are testing  
        const result = await createListing(null, { input }, { dataSources: { userService: new UserService() } });

        // Assert: Validate the results  
        expect(result.success).toBe(true);
    });
});