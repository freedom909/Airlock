import errors from '../utils/errors.js';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';
const { AuthenticationError, ForbiddenError } = errors;
import { validateInviteCode } from './helpers/validateInvitecode.js';

const resolvers = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      const user = await dataSources.accountsAPI.getUser(id);
      if (!user) {
        throw new Error('No user found');
      }
      return user;
    },
    me: async (_, __, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError();
      const user = await dataSources.accountsAPI.getUser(userId);
      return user;
    },
  },

  Mutation: {
    updateProfile: async (_, { updateProfileInput }, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError();
      try {
        const updatedUser = await dataSources.accountsAPI.updateUser({
          userId,
          userInfo: updateProfileInput,
        });
        return {
          code: 200,
          success: true,
          message: 'Profile successfully updated!',
          user: updatedUser,
        };
      } catch (err) {
        return {
          code: 400,
          success: false,
          message: err.message,
        };
      }
    },

    logout: (_, __, context) => {
      // Logic to handle session termination can be added here
      if(context.session){
        context.session.destroy(
          (err) => {
            if (err) {
              throw new Error('Failed to terminate the session');
            }
          },
        );
      }
      return true;
    },

    signIn: async (_, { input: { email, password } }, { dataSources }) => {
      if (email && password) {
        return dataSources.accountsAPI.login(email, password);
      }
      throw new Error('Email and password must be provided');
    },

    signUp: async (_, { signUpInput }, { dataSources }) => {
      const { email, password, name, nickname, role, inviteCode, profilePicture } = signUpInput;
      if (role === 'HOST') {
        const isValidInviteCode = await validateInviteCode(inviteCode);
        if (!inviteCode || !isValidInviteCode) {
          return dataSources.accountsAPI.registerUser(email, name, password, nickname, 'GUEST', profilePicture);
        }
        return dataSources.accountsAPI.registerHost(email, name, password, nickname, 'HOST', profilePicture);
      } else {
        return dataSources.accountsAPI.registerUser(email, name, password, nickname, 'GUEST', profilePicture);
      }
    },
  },

  User: {
    __resolveType(user) {
      if (user.role === 'HOST') {
        return 'Host';
      } else if (user.role === 'GUEST') {
        return 'Guest';
      }
      // Handle other cases or return null if necessary
      return null;
    },
  },

  Host: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    },
    // Uncomment and implement if necessary
    // __coordinates: ({ id }, _, { dataSources }) => {
    //   return dataSources.accountsAPI.getGalacticCoordinates(id);
    // }
  },

  Guest: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id)
    }
  }
}

export default resolvers;
