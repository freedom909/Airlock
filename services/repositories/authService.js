// authService.js
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';

import bcrypt from 'bcrypt';

export const checkPassword = async (plainPassword, hashedPassword) => {
  if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
    throw new TypeError('Arguments must be of type string');
  }
  return await bcrypt.compare(plainPassword, hashedPassword);
};

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async login({ email, password }) {
    try {
      // Find the user by email
      const existingUser = await this.userRepository.findOne({ email });
      console.log("existingUser:", existingUser);

      // Check if the user exists
      if (!existingUser) {
        throw new GraphQLError('User does not exist', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Check if the password matches
      const passwordMatch = await checkPassword(password, existingUser.password);
      if (!passwordMatch) {
        throw new GraphQLError('Incorrect password', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Generate JWT token
      const payload = { id: existingUser._id.toString() };
      const role = existingUser.role;
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Ensure all fields are valid before returning
      if (existingUser._id && role && token) {
        console.log("token:", token);
        console.log("userId:", existingUser._id.toString());
        console.log("role:", role);
        return { token, userId: existingUser._id.toString(), role };
      } else {
        throw new GraphQLError('Incomplete data', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
    } catch (e) {
      console.error('Error during login:', e);

      // Handle specific error codes
      if (e.code === 11000) {
        throw new GraphQLError("Email can't be found", {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Re-throw the error if it's not specifically handled
      throw new GraphQLError('Login failed', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }
}

export default AuthService;