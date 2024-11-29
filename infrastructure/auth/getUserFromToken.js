//import pkg from 'jsonwebtoken';
//const { verify } = pkg;
import jwt from 'jsonwebtoken'
// Secret key for verifying tokens (replace this with your actual secret)
const JWT_SECRET = process.env.JWT_SECRET || 'good';

// Function to get user from JWT token
const getUserFromToken = (token) => {
  try {
    if (token) {
      const user = jwt.verify(token, JWT_SECRET); // Verify the token using the secret key
      console.log('User extracted from token:', user); // Optional: Log user info for debugging
      return user; // Return the user object
    }
    return null;
  } catch (error) {
    console.error('Invalid token', error);
    return null;
  }
};

export default getUserFromToken;
