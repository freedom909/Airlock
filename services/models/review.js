import mongoose from 'mongoose';

// Define the schema for reviews
const reviewSchema = new mongoose.Schema({
  title: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 }, // Corresponds to Float in GraphQL
  content: { type: String, required: true },
  picture: { type: String }, // Optional image upload
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: false }, // Corresponds to locationId in GraphQL
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Host reference
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Guest reference
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Corresponds to the 'author' field in GraphQL
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true }, // Corresponds to bookingId in GraphQL
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Optional comments array //allow users to comment on reviews,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Optional likes array
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Optional dislikes array
  isFeatured: { type: Boolean, default: false },
  isHighlighted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  round: { type: Number, required: true }, // Corresponds to round in GraphQL
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Create the model from the schema
const Review = mongoose.model('Review', reviewSchema);

export default Review;
