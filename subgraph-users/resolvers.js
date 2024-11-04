import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { loginValidate, passwordValidate } from '../infrastructure/helpers/loginValidator.js';
import runValidations from '../infrastructure/helpers/runValidations.js';
import validateInviteCode from '../infrastructure/helpers/validateInvitecode.js';
import generateToken from '../infrastructure/auth/generateToken.js';

// Config and external dependencies
dotenv.config();

// Utility function for error handling
const createGraphQLError = (message, code) => new GraphQLError(message, { extensions: { code } });

// Utility function for checking user existence
const checkUserExistence = async (userService, userId) => {
  const user = await userService.getUserFromDb(userId);
  if (!user) {
    throw createGraphQLError('User not found', 'NO_USER_FOUND');
  }
  return user;
};

// Utility function for caching data
const getCachedData = async (context, cacheKey, fetchFunction, cacheDuration = 1000 * 60 * 60) => {
  const cachedData = await context.cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  const data = await fetchFunction();
  await context.cache.set(cacheKey, data, cacheDuration);
  return data;
};
// Config and external dependencies
dotenv.config();
const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      return checkUserExistence(dataSources.userService.localAuthService, id);
    },
    getUserByEmail: async (_, { email }, { dataSources }) => {
      return dataSources.userService.localAuthService.getUserByEmailFromDb(email);
    },
    me: async (_, __, { dataSources, userId }) => {
      if (!userId) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'BAD_REQUEST_ERROR' }
        });
      }
      return checkUserExistence(dataSources.userService.localAuthService, userId);
    },
    getUsers: async (_, { id }, context) => {
      const cacheKey = `user_${id}`;
      return getCachedData(context, cacheKey, () =>
        context.dataSources.userService.localAuthService.getUserFromDb(id)
      );
    },
  },

  Mutation: {
    signIn: async (_, { input: { email, password } }, { dataSources }) => {
      const user = await dataSources.userService.localAuthService.getUserByEmailFromDb(email);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'USER_NOT_FOUND' }
        });
      }
      if (!loginValidate(email, password)) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'INVALID_LOGIN' }
        });
      }
      return dataSources.userService.localAuthService.login({ email, password });
    },

    signUp: async (_, { input }, { dataSources }) => {
      const { email, password, name, nickname, role, inviteCode, picture } = input;
      console.log('Received input:', input);  // Add this line for debugging
      // Run validations
      await runValidations(input);

      // Additional role validation
      if (role !== 'GUEST' && role !== 'HOST') {
        throw new GraphQLError('Invalid role', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (role === 'HOST') {
        const isValidInviteCode = await validateInviteCode(inviteCode);
        console.log('Invite code validation result:', isValidInviteCode);  // Debugging line
        if (!isValidInviteCode) {
          throw new GraphQLError('Invalid invite code', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
      }

      // Ensure dataSources.userService is available
      const { userService } = dataSources;
      console.log('dataSources');  // Add this line for debugging
      if (!userService) {
        throw new GraphQLError('UserService not available', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
      try {
        const user = userService.localAuthService.registerUser({ email, password, name, nickname, role, picture });
        const token = await dataSources.userService.tokenService.generateToken({ id: user._id, role: user.role });

        return {
          token,
          userId: user._id,
          role: user.role,
        };
      } catch (error) {
        console.error('Error during signUp:', error);
        throw new GraphQLError('User registration failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },


    logout: async (_, __, { session }) => {
      if (session) {
        return new Promise((resolve, reject) => {
          session.destroy(err => {
            if (err) {
              return reject(new GraphQLError('Failed to terminate the session', {
                extensions: { code: 'FAILED_TO_TERMINATE_SESSION' }
              }));
            }
            resolve(true);
          });
        });
      }
      return true;
    },

    forgotPassword: async (_, { email }, { dataSources }) => {
      if (!email) {
        throw new GraphQLError('Email is required', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const user = await dataSources.userService.localAuthService.getUserByEmailFromDb(email);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const token = generateToken(user);
      await dataSources.userService.localAuthService.sendLinkToUser(user.email, token);
      return { code: 200, success: true, message: 'Password reset link sent successfully', email: user.email };
    },

    updatePassword: async (_, { userId, password, newPassword }, { dataSources }) => {
      if (!userId) {
        throw new GraphQLError('User ID is required', {
          extensions: { code: 'USER_ID_REQUIRED' }
        });
      }

      const user = await checkUserExistence(dataSources.userService.localAuthService, userId);

      await passwordValidate(newPassword);
      await passwordValidate(password);

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new GraphQLError('Invalid password', {
          extensions: { code: 'INVALID_PASSWORD' }
        });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      return dataSources.userService.localAuthService.editPassword(userId, hashedNewPassword);
    },

    loginWithOAuth: async (_, { provider, token }, { dataSources }) => {
      return dataSources.userService.oauthService.loginWithProvider({ provider, token });
    },
  },

  // ... rest of the resolvers remain unchanged
};

export default resolvers;
