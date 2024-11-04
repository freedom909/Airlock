import mongoose from "mongoose";
const { Schema } = mongoose;

const profileSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true,
    unique: true
  },
  fullname: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  interests: [String],
  network: [String],
});

// Add text index for searching
profileSchema.index({ fullname: "text"});

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
