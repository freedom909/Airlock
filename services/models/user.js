// models/user.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'GUEST', 'HOST'], default: 'GUEST' },
  password: { type: String, required: function () { return !this.provider; } },
  token: { type: String },
  refresh_token: { type: String },
  picture: { type: String },
  description: { type: String },
  nickname: { type: String, unique: true },
  provider: { type: String },
  providerId: { type: String },
});

// Add the partial index for providerId
userSchema.index({ providerId: 1 }, { unique: true, partialFilterExpression: { providerId: { $type: "string" } } });

const User = mongoose.model('User', userSchema);

export default User;
