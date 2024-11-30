import pkg from 'jsonwebtoken';
const { sign } = pkg;
import dotenv from 'dotenv';

dotenv.config();


// Secret key for signing tokens (replace this with your actual secret)
const JWT_SECRET = process.env.JWT_SECRET || 'good';

// Function to generate JWT token
async function generateToken(user) {
  const payload = {
    userId: user._id.toString(), // Assuming user has an _id field
    email: user.email,
    role: user.role,
  };

  // Generate JWT token with a payload and secret key
  const token = sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
  return token;
}

export default generateToken;
