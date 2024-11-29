import { RESTDataSource } from '@apollo/datasource-rest';
import UserRepository from '../repositories/userRepository.js';
import User from '../models/user.js'; // Adjust the path according to your new structure
import { hashPassword, checkPassword } from '../helpers/passwords.js'; // Adjust the path accordingly
import { GraphQLError, doTypesOverlap } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';//Error during login: TypeError: Cannot read properties of undefined (reading 'sign')
import { loginValidate } from '../helpers/loginValidator.js';
import pkg from 'mongodb';
import MailToUser from '../email/mailTo.js';
const { MongoClient, ObjectId } = pkg;
import dotenv from 'dotenv';
dotenv.config();
// Adjust the path accordingly

class UserService extends RESTDataSource {
    constructor({ userRepository }) {
        super();
        this.baseURL = "http://localhost:4000/";
        this.userRepository = userRepository;
        this.mailToUser = new MailToUser();
    }

    async register({ email, password, name, nickname, role, picture }) {
        const existingUser = await this.userRepository.findOne({ nickname });
        console.log("existingUser:", existingUser); // Corrected the variable name

        if (existingUser) {
            throw new GraphQLError(
                "Nickname is already in use, please use another one",
                {
                    extensions: { code: "BAD_USER_INPUT" },
                }
            );
        }

        const passwordHash = await hashPassword(password);
        const newUser = {
            email,
            name,
            password: passwordHash,
            nickname,
            role,
            picture,
        };

        try {
            const result = await this.userRepository.insertUser(newUser);
            console.log("User successfully inserted:", result);

            const userId = result.insertedId.toString();
            const payload = { _id: userId };
            console.log("payload", payload); // Added payload to the log
            const jwtKey = process.env.JWT_SECRET
            const token = jwt.sign(payload, "jwtKey", {
                expiresIn: "1h",
            });
            console.log("JWT token generated:", token);

            return {
                userId,
                token,
            };
        } catch (e) {
            console.error("Error during registration:", e);

            if (e.code === 11000) {
                throw new GraphQLError("Email is already in use", {
                    extensions: { code: "BAD_USER_INPUT" },
                });
            }
            // Re-throw error if it is not a duplicate key error
            throw new GraphQLError("Registration failed", {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
            });
        }
    }

    async getUserByNickname(nickname) {
        return await this.userRepository.findOne({ nickname });
    }
    async login({ email, password }) {
        // Validate email and password
        await loginValidate(email, password);

        // Find the user by email
        const user = await this.userRepository.getUserByEmailFromDb(email);
        if (!user) {
            throw new GraphQLError("User not found", {
                extensions: { code: "BAD_USER_INPUT" },
            });
        }
        //Check if the password matches
        const passwordMatch = await checkPassword(password, user.password);
        if (!passwordMatch) {
            throw new GraphQLError("Incorrect password", {
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

    async sendLinkToUser(email, token) {

        await this.mailToUser.sendActivationPassword(email, token);
    }
    async updateUser(userId, newData) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    password: hashedPassword
                },
                { new: true }

            );
            return updatedUser.value;
        } catch (error) {
            console.error("Error updating user:", error);
            throw new GraphQLError("Error updating user", {
                extensions: { code: "SERVER_ERROR" },
            });
        }
    }

    async getUserById(id) {
        try {
            const user = await this.userRepository.findById(id);
            if (!user) {
                throw new GraphQLError("User not found", {
                    extensions: { code: "BAD_USER_INPUT" },
                });
            }
            return user;
        } catch (error) {
            console.error("Error fetching user:", error);
            throw new GraphQLError("Error fetching user", {
                extensions: { code: "INTERNAL_SERVER_ERROR" },
            });
        }
    }
    async deleteUser(userId) {
        try {
            const result = await this.userRepository.findByIdAndDelete(userId);
            if (result.value) {
                console.log("Successfully deleted one document.");
            } else {
                console.log("No documents matched the query. Deleted 0 documents.");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            throw new GraphQLError("Error deleting user", {
                extensions: { code: "SERVER_ERROR" },
            });
        }
    }

    async findById(id) {
        return await this.userRepository.findById(id);
    }

    async getUserFromDb(id) {
        return await this.userRepository.findById(id);
    }

    async getUserByEmailFromDb(email) {
        return this.userRepository.findOne({ email });
    }

    async validatePassword(inputPassword, storedPassword) {
        return bcrypt.compare(inputPassword, storedPassword);
    }

    async editPassword(userId, hashedNewPassword) {
        const result = await this.userRepository.findByIdAndUpdate(
            userId,
            { password: hashedNewPassword },
            { returnOriginal: false, new: true }
        );

        if (!result) {
            throw new GraphQLError("Error updating password", { extensions: { code: "INTERNAL_SERVER_ERROR" } });
        }

        // Generate a new token if needed
        const token = jwt.sign({ id: result._id }, process.env.JWT_SECRET || "good", { expiresIn: "1h" });
        console.log('Generated token:', token);

        const userObject = typeof result.toObject === 'function' ? result.toObject() : result;

        return { ...userObject, token, userId };
    }


    async createResetPasswordToken(userId) {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        // Save the token in the database or a cache if necessary
        return token;
    }

    async sendResetPasswordEmail(email, token) {
        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset Link',
            html: `
      <h1>Please use the following link to reset your password</h1>
      <p>${process.env.CLIENT_URL}/reset-password?token=${token}</p>
      <hr />
      <p>This email may contain sensitive information</p>
      <p>${process.env.CLIENT_URL}</p>
    `,
        };

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        try {
            await transporter.sendMail(emailData);
            console.log(`Password reset email sent to ${email}`);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Error sending password reset email');
        }
    };
}
export default UserService