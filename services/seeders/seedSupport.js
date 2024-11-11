import connectToMongoDB from "../DB/connectMongoDB.js";
import mongoose from "mongoose";
import Message from '../models/support.js'; // Adjust the path as needed


// Mock data
const mockMessages = [
    { message: 'What are the check-in and check-out times?', reply: 'Check-in is from 3 PM and check-out is by 11 AM.' },
    { message: 'Is breakfast included in the room rate?', reply: 'Yes, a continental breakfast is included in all room rates.' },
    { message: 'Do you offer airport transportation?', reply: 'Yes, we provide airport transfers upon request.' },
    { message: 'Can I bring my pet to the hotel?', reply: 'Yes, we are a pet-friendly hotel! A small fee applies.' },
    { message: 'Are there any nearby tourist attractions?', reply: 'Yes, we are located close to several popular attractions, including the city park and museum.' }
];

// Insert mock data
const insertMockMessage = async () => {
    try {
        // Establish connection to MongoDB
        await connectToMongoDB();
        console.log('Connected to MongoDB');

        // Clear existing collections
        await Message.deleteMany({});

        console.log('Existing data cleared!');

        for (const message of mockMessages) {
            // Create message
            const newMessage = new Message({
                _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId
                message: message.message,
                reply: message.reply
            });
            await newMessage.save();
            console.log('Mock data inserted successfully');
        }
    } catch (err) {
        console.error("Error inserting mock data:", err);
    }
}

// Call the function and close the connection
(async () => {
    await insertMockMessage();
    mongoose.connection.close(); // Close connection after operation
})();