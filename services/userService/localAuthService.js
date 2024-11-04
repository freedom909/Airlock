
import UserRepository from '../repositories/userRepository.js';
import { hashPassword, checkPassword } from '../../infrastructure/helpers/passwords.js'; // Adjust the path accordingly
import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginValidate } from '../../infrastructure/helpers/loginValidator.js';
import dotenv from 'dotenv';
import tokenService from './tokenService.js';
dotenv.config();


class LocalAuthService {
  constructor({ mongodb }) {
    this.userRepository = new UserRepository({ mongodb });
  }

  async authenticateUser(email, password) {
    const user = await this.userRepository.getUserByEmailFromDb(email);
    if (!user || !(await this.userRepository.checkPassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return user; // Return user object for further processing
  }

  async registerUser(userData) {
    // Similar to previous example
    const hashedPassword = await this.userRepository.hashPassword(userData.password);
    const user = await this.userRepository.insertUser({ ...userData, password: hashedPassword });

    const token = await this.userRepository.generateToken(user);
    await this.userRepository.sendVerificationEmail(userData.email, token);

    return user;
  }

  async login({ email, password }) {
    // Validate email and password
    await loginValidate(email, password);

    // Find the user by email
    const user = await this.userRepository.getUserByEmailFromDb(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new GraphQLError("Invalid email or password", { extensions: { code: "UNAUTHORIZED" } });
    }

    // Check if the password matches
    const passwordMatch = await checkPassword(password, user.password);
    if (!passwordMatch) {
      throw new GraphQLError("Incorrect password", { extensions: { code: "BAD_USER_INPUT" } });
    }

    try {
      // Generate JWT token
      const token = tokenService.generateToken({ userId: user._id.toString() });
      return { token, user };
    } catch (e) {
      console.error("Error during login:", e);
      throw new GraphQLError("Login failed", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }

  async getUserById(id) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new GraphQLError("User not found", { extensions: { code: "BAD_USER_INPUT" } });
      }
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new GraphQLError("Error fetching user", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }

  async updateUser(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    try {
      const updatedUser = await this.userRepository.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new GraphQLError("Error updating user", { extensions: { code: "SERVER_ERROR" } });
    }
  }

  async deleteUser(userId) {
    try {
      const result = await this.userRepository.findByIdAndDelete(userId);
      if (!result) {
        console.log("No documents matched the query. Deleted 0 documents.");
      }
      return result;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new GraphQLError("Error deleting user", { extensions: { code: "SERVER_ERROR" } });
    }
  }

  async generateJwt(payload) {
    const jwtKey = process.env.JWT_SECRET || "default_secret";
    return jwt.sign(payload, jwtKey, { expiresIn: "1h" });
  }

  async updateUserProfile(userId, updateData) {
    try {
      const updatedUser = await this.userRepository.findByIdAndUpdate(userId, updateData, { new: true });
      if (!updatedUser) {
        throw new GraphQLError("User not found", { extensions: { code: "USER_NOT_FOUND" } });
      }
      return updatedUser;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new GraphQLError("Error updating user profile", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }

  async activateUserAccount(userId) {
    try {
      const updatedUser = await this.userRepository.findByIdAndUpdate(userId, { active: true }, { new: true });
      if (!updatedUser) {
        throw new GraphQLError("User not found", { extensions: { code: "USER_NOT_FOUND" } });
      }
      return {
        success: true,
        message: "User account activated successfully",
      };
    } catch (error) {
      console.error("Error activating user account:", error);
      throw new GraphQLError("Error activating user account", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }

  async generateResetToken(email) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new GraphQLError("User not found", { extensions: { code: "USER_NOT_FOUND" } });
    }

    const resetToken = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Send reset email
    await this.sendResetPasswordEmail(email, resetToken);

    return {
      success: true,
      message: "Password reset link sent to email",
    };
  }

  async resetPassword(userId, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = await this.userRepository.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      throw new GraphQLError("Error updating password", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }

    return {
      success: true,
      message: "Password updated successfully",
    };
  }

  async deactivateUserAccount(userId) {
    try {
      const result = await this.userRepository.findByIdAndUpdate(userId, { active: false });
      if (!result) {
        throw new GraphQLError("User not found", { extensions: { code: "USER_NOT_FOUND" } });
      }
      return {
        success: true,
        message: "User account deactivated successfully",
      };
    } catch (error) {
      console.error("Error deactivating user account:", error);
      throw new GraphQLError("Error deactivating user account", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }

  async updateUserRole(userId, role) {
    try {
      const updatedUser = await this.userRepository.findByIdAndUpdate(userId, { role }, { new: true });
      if (!updatedUser) {
        throw new GraphQLError("User not found", { extensions: { code: "USER_NOT_FOUND" } });
      }
      return {
        success: true,
        message: `User role updated to ${role}`,
        user: updatedUser,
      };
    } catch (error) {
      console.error("Error updating user role:", error);
      throw new GraphQLError("Error updating user role", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
    }
  }


}

export default LocalAuthService;
