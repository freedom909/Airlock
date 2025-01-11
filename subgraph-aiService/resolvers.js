import Configuration from 'openai';
import OpenAIApi from 'openai';
import Listing from '../services/models/listing.js';
import dotenv from 'dotenv';

dotenv.config();
const key = process.env.OPENAI_API_KEY
const configuration = new Configuration({
    apiKey: "key",
});
console.log('API Key:', process.env.OPENAI_API_KEY);
const openai = new OpenAIApi(configuration);

const resolvers = {
    Mutation: {
        sendMessageToChatGPT: async (_, { message }, { dataSources, userId }) => {
            console.log("Data sources:", dataSources); // Data sources: undefined
            if (!dataSources || !dataSources.aiService) {
                throw new Error('AI service is not available');
            }
            const { aiService, userService } = dataSources; // message": "Cannot destructure property 'aiService' of 'dataSources' as it is undefined.",
            if (!aiService) {
                throw new Error('ai service is not available in data sources');
            }
            try {
                const response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo", // or "gpt-4" if available
                    messages: [{ role: "user", content: message }],
                });
                const reply = await response.data.choices[0].message.content
                //save message and reply to the database
                const savedMessage = await aiService.savedMessageToDB(message, reply)
                return { reply: response.data.choices[0].message.content };
            } catch (error) {
                console.error(error);
                throw new Error("Error communicating with ChatGPT");
            }
        },
        getListingInfo: async (_, { listingTitle }, { dataSource, userId }) => {
            const { aiService } = dataSource;
            const listingData = await Listing.findOne({ title: listingTitle }).exec();

            if (!listingData) throw new Error(`Listing with title "${listingTitle}" not found`);

            // Authorization check for sensitive fields
            const bookings = userId && listingData.bookings.some(b => b.guestId === userId)
                ? listingData.bookings
                : null;

            const currentlyBookedDates = userId && listingData.bookings.some(b => b.guestId === userId)
                ? listingData.currentlyBookedDates
                : null;

            const message = `What are the available dates for the listing: ${listingData.title}?`;

            // Send a refined question to ChatGPT with the filtered data
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: message }],
            });

            const reply = response.data.choices[0].message.content;
            await aiService.saveMessageToDB(message, reply);

            return {
                ...listingData.toObject(),
                bookings,
                currentlyBookedDates,
            };
        },
    },
    Query: {
        Listing: {
            bookings: async (listing, _, { userId }) => {
                if (!userId || !listing.bookings.some(b => b.guestId === userId)) {
                    throw new AuthenticationError("Access denied to booking details");
                }
                return listing.bookings;
            },
            currentlyBookedDates: async (listing, _, { userId }) => {
                if (!userId || !listing.bookings.some(b => b.guestId === userId)) {
                    throw new AuthenticationError("Access denied to booked dates");
                }
                return listing.currentlyBookedDates;
            },


        },
        getUser: (_, __, { user, dataSources }) => {
            // Access userId here  

            // Implement logic to fetch user data from the database or other sources
            // Example usage  
            if (user.role === 'GUEST') {
                return dataSources.userService.getGuestUser();
            }
            return dataSources.userService.getUser(user.id);
        }
    }
};

export default resolvers;
