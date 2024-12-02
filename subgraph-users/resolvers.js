import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
import { loginValidate, passwordValidate } from '../infrastructure/helpers/loginValidator.js';
import runValidations from '../infrastructure/helpers/runValidations.js';
import validateInviteCode from '../infrastructure/helpers/validateInvitecode.js';
import TokenService from '../services/userService/tokenService.js';
import LocalAuthService from '../services/userService/localAuthService.js';
import OAuthService from '../services/userService/oauthService.js';

// Config and external dependencies
dotenv.config();

// Utility function for error handling
const resolvers = {
  Mutation: {
    Query: {
      user: async (_, { id }, { dataSources }) => {
        const { localAuthService } = dataSources.userService;
        const user = await localAuthService.getUserFromDb(id);
        if (!user) {
          throw new GraphQLError("No user found", {
            extensions: { code: "NO_USER_FOUND" },
          });
        }
        return user;
      },
      getUserByEmail: async (_, { email }, { dataSources }) => {
        const { localAuthService } = dataSources.userService;
        return localAuthService.getUserByEmailFromDb(email);
      },
      me: async (_, __, { dataSources, userId }) => {
        const { localAuthService } = dataSources.userService;
        if (!userId) {
          throw new GraphQLError("User not authenticated", {
            extensions: { code: ApolloServerErrorCode.BAD_REQUEST_ERROR },
          });
        }
        const user = await localAuthService.getUserFromDb(userId);
        return user;
      },
    },


    signIn: async (_, { input }, context) => {
      try {
        console.log('Resolver context:', context); // Debugging context
        const { dataSources } = context;

        // Validate dataSources and services
        if (!dataSources || !dataSources.userService) {
          throw new GraphQLError('UserService is not defined in dataSources', {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          });
        }

        const { localAuthService, oAuthService } = dataSources.userService;
        if (!localAuthService || !oAuthService) {
          throw new GraphQLError('Required authentication services are missing', {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          });
        }

        const { email, password, provider, providerToken } = input;
        let user;

        if (provider) {
          // Third-party login
          if (!providerToken) {
            throw new GraphQLError('Provider token is required for third-party login', {
              extensions: { code: 'PROVIDER_TOKEN_REQUIRED' },
            });
          }

          // Validate provider token
          const isValidToken = await oAuthService.validateProviderToken(provider, providerToken);
          if (!isValidToken) {
            throw new GraphQLError('Invalid provider token', {
              extensions: { code: 'INVALID_PROVIDER_TOKEN' },
            });
          }

          // Login with the provider token
          user = await oAuthService.loginWithProvider(provider, providerToken);
        } else {
          // Email/password login
          if (!loginValidate(email, password)) {
            throw new GraphQLError('Invalid email or password', {
              extensions: { code: 'INVALID_LOGIN' },
            });
          }

          user = await localAuthService.login({ email, password });
        }

        if (!user) {
          throw new AuthenticationError('Invalid credentials');
        }

        // Return the user or a token as required
        return {
          userId: user.id,
          token: generateToken(user.id),
          role: user.role,
        }
      } catch (error) {
        console.error('Error in signIn resolver:', error);
        throw error; // Re-throw the error to be handled by Apollo Server
      }
    },


    signUp: async (_, { input }, { dataSources }) => {

      if (!dataSources || !dataSources.userService) {
        throw new Error('dataSources.userService is not defined');
      }

      const { localAuthService, tokenService } = dataSources.userService;

      // Proceed with the sign-up logic
      const { email, password, name, nickname, role, inviteCode, picture } = input;

      // Run validations
      await runValidations(input);

      // Additional role validation
      if (role === 'HOST') {
        const isValidInviteCode = await validateInviteCode(inviteCode);
        if (!isValidInviteCode) {
          throw new GraphQLError('Invalid invite code', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }

      try {
        const user = await localAuthService.register({
          email,
          password,
          name,
          nickname,
          role,
          picture,
        });

        const token = await tokenService.generateToken({ id: user._id, role: user.role });

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

    loginWithOAuth: async (_, { input }, context) => {
      try {
        const { dataSources } = context;
        // Validate dataSources and services
        if (!dataSources || !dataSources.userService) {
          throw new GraphQLError('UserService is not defined in dataSources', {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          });
        }

        const { tokenService, oAuthService } = dataSources.userService;
        if (!tokenService || !oAuthService) {
          throw new GraphQLError('Required authentication services are missing', {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          });
        }

        const { provider, providerToken } = input;
        const user = await oAuthService.loginWithProvider(provider, providerToken);
        if (!user) {
          throw new AuthenticationError('Invalid credentials');
        }
        const token = await tokenService.generateToken({ id: user._id, role: user.role });

        return {
          token,
          userId: user._id,
          role: user.role,
        }
      } catch (error) {
        console.error('Error in loginWithOAuth resolver:', error);
        throw error; // Re-throw the error to be handled by Apollo Server
      }
    },

    logout: (_, __, context) => {
      if (context.session) {
        context.session.destroy(err => {
          if (err) {
            throw new GraphQLError('Failed to terminate the session', { extensions: { code: 'FAILED_TO_TERMINATE_SESSION' } });
          }
        });
      }
      return true;
    },

    forgotPassword: async (_, { email }, { dataSources }) => {
      try {
        console.log('Received email:', email); // Debugging line
        //  await loginValidate(email);
        const { localAuthService } = dataSources.userService;
        // Validate the email input
        if (!email) {
          throw new GraphQLError("Email is required", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        // Retrieve the user by email from the database
        const user = await localAuthService.getUserByEmailFromDb(email);
        if (!user) {
          throw new GraphQLError("User not found", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        // Generate a reset password token
        const token = generateToken(user);
        console.log('Generated token:', token); // Debugging line
        await localAuthService.sendLinkToUser(user.email, token);
        console.log('Email sent to user:', user.email); // Debugging line
        // Return the token and user info
        const response = {
          code: 200,
          success: true,
          message: "Password reset link sent successfully",
          email: user.email,
        }
        console.log('Response:', response); // Debugging line
        return response;
      } catch (error) {
        console.error('Error in forgotPassword resolver:', error);
        throw new GraphQLError('Internal Server Error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updatePassword: async (_, { userId, password, newPassword }, { dataSources }) => {
      //retrieve the user from the db
      if (!userId) {
        return new GraphQLError("User ID is required", { extensions: { code: "USER_ID_REQUIRED" } });
      }
      const { localAuthService } = dataSources.userService;
      const user = await userService.findById(userId);// "message": "User not found",
      console.log('User retrieved from DB:', user);
      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "USER_NOT_FOUND" },
        });
      }
      //validate the password

      await passwordValidate(newPassword);//"Password must contain at least 8 characters and include a number",
      await passwordValidate(password);
      // validate the is matching
      const passwordMatch = bcrypt.compareSync(password, user.password);
      console.log('Password match result:', passwordMatch);
      if (!passwordMatch) {
        throw new GraphQLError("Invalid password", {
          extensions: { code: "INVALID_PASSWORD" },
        });
      }
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await localAuthService.editPassword(userId, hashedNewPassword);
      console.log('User after password update:', updatedUser);
      return updatedUser;
    },

    generateInviteCode: async (_, { }, { dataSources, userId }) => {
      if (!userId) {
        throw new GraphQLError("Please login to send invite code", {
          extensions: {
            code:
              "USER_ID_REQUIRED"
          }
        });
      }
      const user = await getUserById(id)
      // Ensure that only hosts can generate invite codes
      if (user.role !== 'HOST') {
        throw new GraphQLError("Only hosts can generate invite codes", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const { localAuthService } = dataSources.userService;
      const inviteCode = await localAuthService.generateInviteCode(email, user);
      return { inviteCode };
    },

    sendInviteCode: async (_, { email }, { dataSources, userId }) => {
      if (!userId) {
        throw new GraphQLError("Please login to send invite code", {
          extensions: {
            code:
              "USER_ID_REQUIRED"
          }
        });
      }
      const user = await getUserById(id)
      if (user.role !== 'HOST') {
        throw new GraphQLError("Only hosts can send invite codes", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const { localAuthService } = dataSources.userService;
      const inviteCode = await localAuthService.generateInviteCode(email);
      await localAuthService.sendInviteCode(email, inviteCode)
      return { success: true };
    },

    requestResetPassword: async (_, { email }, { dataSources }) => {
      const { localAuthService } = dataSources.userService;
      // Validate the email input (optional step)
      if (!email) {
        throw new GraphQLError("Email is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      // Retrieve the user by email from the database
      const user = await localAuthService.getUserByEmailFromDb(email);
      if (!user) {
        throw new GraphQLError("User not found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const token = await localAuthService.createResetPasswordToken(user.id);
      await sendResetPasswordEmail(user.email, token);
      return {
        code: 200,
        success: true,
        message: "Password reset link sent successfully",
      };
    },

    thirdPartyLogin: async (_, { input }, context) => {
      try {
        console.log('Resolver context:', context); // Debugging context
        const { dataSources } = context;

        // Validate dataSources and services
        if (!dataSources?.userService) {
          throw new GraphQLError('UserService is not defined in dataSources', {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          });
        }

        const { oAuthService, tokenService } = dataSources.userService;
        if (!oAuthService || !tokenService) {
          throw new GraphQLError('Required authentication services are missing', {
            extensions: { code: 'SERVICE_UNAVAILABLE' },
          });
        }

        // Validate the input
        const { provider, providerToken } = input;
        if (!provider || !providerToken) {
          throw new GraphQLError("Invalid third-party login input", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        // Validate the provider token
        const userInfo = await oAuthService.validateProviderToken(provider, providerToken);
        if (!userInfo) {
          throw new AuthenticationError("Invalid credentials");
        }

        // Generate a JWT for the authenticated user
        const jwtToken = await tokenService.generateToken(userInfo); // Ensure this method is correctly implemented

        return {
          token: jwtToken,
          success: true,
        };
      } catch (error) {
        console.error('Error in thirdPartyLogin resolver:', error);

        // Rethrow GraphQL-specific errors directly
        if (error instanceof GraphQLError || error instanceof AuthenticationError) {
          throw error;
        }

        // Wrap and throw unexpected errors
        throw new GraphQLError('An unexpected error occurred', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: error },
        });
      }
    }
  },
  _Entity: {
    __resolveType(entity) {
      if (entity.__typename === 'Host') {
        return 'Host';
      }
      if (entity.__typename === 'Guest') {
        return 'Guest';
      }
      return null; // GraphQLError is thrown
    },
  },

  User: {
    __resolveType(user) {
      if (user.role === "HOST") {
        return "Host";
      } else if (user.role === "GUEST") {
        return "Guest";
      }
      return null;
    },
  },
  Host: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.userService.getUserFromDb(user.id);
    },
  },
  Guest: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.userService.getUserFromDb(user.id);
    },
  }
}


export default resolvers;
