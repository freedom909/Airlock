const mockData = [
    {
        title: "Amazing Stay!",
        rating: 5,
        content: "I had a wonderful experience at this location. The host was very welcoming and the amenities were top-notch.",
        picture: "https://example.com/image1.jpg",
        locationId: "60d21b4667d0d8992e610c85", // Replace with actual ObjectId  
        hostId: "60d21b4667d0d8992e610c86", // Replace with actual ObjectId  
        guestId: "60d21b4667d0d8992e610c87", // Replace with actual ObjectId  
        authorId: "60d21b4667d0d8992e610c88", // Replace with actual ObjectId  
        bookingId: "60d21b4667d0d8992e610c89", // Replace with actual ObjectId  
        comments: [], // No comments yet  
        likes: ["60d21b4667d0d8992e610c87"], // User who liked the review  
        dislikes: [], // No dislikes  
        isFeatured: true,
        isHighlighted: false,
        isPinned: false,
        round: 1,
    },
    {
        title: "Not as expected",
        rating: 2,
        content: "The place was not clean, and the host was unresponsive. Very disappointed.",
        picture: "https://example.com/image2.jpg",
        locationId: "60d21b4667d0d8992e610c85", // Replace with actual ObjectId  
        hostId: "60d21b4667d0d8992e610c86", // Replace with actual ObjectId  
        guestId: "60d21b4667d0d8992e610c87", // Replace with actual ObjectId  
        authorId: "60d21b4667d0d8992e610c88", // Replace with actual ObjectId  
        bookingId: "60d21b4667d0d8992e610c89", // Replace with actual ObjectId  
        comments: [], // No comments yet  
        likes: [], // No likes  
        dislikes: ["60d21b4667d0d8992e610c88"], // User who disliked the review  
        isFeatured: false,
        isHighlighted: true,
        isPinned: false,
        round: 1,
    },
    {
        title: "Good value for money",
        rating: 4,
        content: "The location is great and the price is very reasonable. Would recommend to others!",
        picture: "https://example.com/image3.jpg",
        locationId: "60d21b4667d0d8992e610c85", // Replace with actual ObjectId  
        hostId: "60d21b4667d0d8992e610c86", // Replace with actual ObjectId  
        guestId: "60d21b4667d0d8992e610c87", // Replace with actual ObjectId  
        authorId: "60d21b4667d0d8992e610c88", // Replace with actual ObjectId  
        bookingId: "60d21b4667d0d8992e610c89", // Replace with actual ObjectId  
        comments: [], // No comments yet  
        likes: ["60d21b4667d0d8992e610c87"], // User who liked the review  
        dislikes: [], // No dislikes  
        isFeatured: false,
        isHighlighted: false,
        isPinned: true,
        round: 1,
    },
    {
        title: "Terrible Experience",
        rating: 1,
        content: "The worst place I've ever stayed. Do not recommend at all.",
        picture: "https://example.com/image4.jpg",
        locationId: "60d21b4667d0d8992e610c85", // Replace with actual ObjectId  
        hostId: "60d21b4667d0d8992e610c86", // Replace with actual ObjectId  
        guestId: "60d21b4667d0d8992e610c87", // Replace with actual ObjectId  
        authorId: "60d21b4667d0d8992e610c88", // Replace with actual ObjectId  
        bookingId: "60d21b4667d0d8992e610c89", // Replace with actual ObjectId  
        comments: [], // No comments yet  
        likes: [], // No likes  
        dislikes: ["60d21b4667d0d8992e610c88"], // User who disliked the review  
        isFeatured: false,
        isHighlighted: true,
        isPinned: false,
        round: 1,
    },
    {
        title: "Decent place",
        rating: 3,
        content: "The stay was okay, but there were a few issues with the plumbing.",
        picture: "https://example.com/image5.jpg",
        locationId: "60d21b4667d0d8992e610c85", // Replace with actual ObjectId  
        hostId: "60d21b4667d0d8992e610c86", // Replace with actual ObjectId  
        guestId: "60d21b4667d0d8992e610c87", // Replace with actual ObjectId  
        authorId: "60d21b4667d0d8992e610c88", // Replace with actual ObjectId  
        bookingId: "60d21b4667d0d8992e610c89", // Replace with actual ObjectId  
        comments: [], // No comments yet  
        likes: [], // No likes  
        dislikes: [], // No dislikes  
        isFeatured: false,
        isHighlighted: false,
        isPinned: false,
        round: 1,
    }
];
import connectToMongoDB from "../DB/connectMongoDB.js";
import Review from "../models/review.js";
import mongoose from "mongoose";

// Example of how to insert mock data into MongoDB  
const insertMockData = async () => {
    try {
        // Establish connection to MongoDB
        await connectToMongoDB();
        console.log('Connected to MongoDB');

        // Clear existing collections
        await Review.deleteMany({});
        console.log('Existing data cleared!');

        for (const review of mockData) {
            // Create new review object
            const newReview = new Review({
                _id: new mongoose.Types.ObjectId(), // Generate a new ObjectId
                title: review.title,
                locationId: review.locationId,
                guestId: review.guestId,
                authorId: review.authorId,
                bookingId: review.bookingId,
                comments: review.comments,
                likes: review.likes,
                dislikes: review.dislikes,
                isFeatured: review.isFeatured,
                isHighlighted: review.isHighlighted,
                isPinned: review.isPinned,
                round: review.round,
                rating: review.rating,
                content: review.content,
                picture: review.picture,
                createdAt: new Date(),
                updatedAt: new Date(),
                hostId: review.hostId,
            });
            await newReview.save();
        }
        console.log('Mock data inserted successfully!');
    } catch (err) {
        console.error("Error inserting mock data:", err);
    }
}

// Call the function to insert mock data  
insertMockData();