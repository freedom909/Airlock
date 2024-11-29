
import UserRepository from '../repositories/userRepository.js';
import { RESTDataSource } from "@apollo/datasource-rest";
import { hashPassword, checkPassword } from '../../infrastructure/helpers/passwords.js'; // Adjust the path accordingly
import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginValidate } from '../../infrastructure/helpers/loginValidator.js';
import dotenv from 'dotenv';
import tokenService from './tokenService.js';
import OAuthService from './oAuthService.js';

dotenv.config();


class LocalAuthService extends RESTDataSource {
  constructor({ userRepository }) {
    super();
    this.baseURL = "http://localhost:4000/";
    if (!userRepository) {
      throw new Error("UserRepository not provided to UserService");
    }
    this.userRepository = userRepository;

  }

  async authenticateUser(email, password) {
    const user = await this.userRepository.getUserByEmailFromDb(email);
    if (!user || !(await this.userRepository.checkPassword(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    return user; // Return user object for further processing
  }

  async register(userData) {
    // Similar to previous example
    const hashedPassword = await this.userRepository.hashPassword(userData.password);
    const user = await this.userRepository.insertUser({ ...userData, password: hashedPassword });


    const token = await this.userRepository.generateToken({ _id: user.insertedId }); // Pass the correct _id
    await this.userRepository.sendVerificationEmail(userData.email, token);

    return user;
  }

  async login(email, password) {
    // Find the user by email
    const user = await this.authenticateUser(email, password);

    if (!user) {
      throw new GraphQLError("Incorrect password or email", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    try {
      // Generate JWT token
      const payload = { id: user._id.toString() };
      const role = user.role;
      const token = jwt.sign(payload, "good", { expiresIn: '1h' });
      // Return the token and user info
      return {
        code: 200,
        success: true,
        message: "Login successful",
        token: token,
        userId: user._id.toString(),
        role: role,
      };
    } catch (e) {
      console.error("Error during login:", e);

      // Handle specific error codes
      if (e.code === 11000) {
        throw new GraphQLError("Email can't be found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Re-throw the error if it's not specifically handled
      throw new GraphQLError("Login failed", {
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      });
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
  async getUserByEmailFromDb(email) {
    return this.userRepository.findOne({ email });
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
