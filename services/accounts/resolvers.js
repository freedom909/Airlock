import errors from '../utils/errors.js';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';

import { validateInviteCode } from '../../infrastructure/helpers/validateInvitecode.js';
import DateTimeType from '../../shared/src/scalars/DateTimeType.js';
import { authenticateJWT,checkPermissions } from '../../infrastructure/auth/auth.js'
import { isHost,isAdmin } from '../../infrastructure/auth/permission.js';



const resolvers = {
  DateTime: DateTimeType,

  Account: {
    __resolveReference(reference, { dataSources, user }) {
      if (user?.sub) {
        return dataSources.accountsAPI.getAccountById(reference.id);
      }
      throw new GraphQLError("Not authorized!",{extensions:{
        code:'Unauthorizated',
      }});
    },
    id(account) {
      return account.user_id;
    },
    createdAt(account) {
      return account.created_at;
    },
    email(account) {
      return account.email;
    }
  },

  Query: {
    user: async (_, { id }, { dataSources }) => {
      const user = await dataSources.accountsAPI.getUser(id);
      if (!user) {
        throw new GraphQLError('No user found', { extensions: { code: 'NO_USER_FOUND' } });
      }
      return user;
    },
    me: async (_, __, { dataSources, userId }) => {
      if (!userId) throw new AuthenticationError();
      const user = await dataSources.accountsAPI.getUser(userId);
      return user;
    },
    account: async (_, { id }, { dataSources }) => {
      return dataSources.accountsAPI.getAccountById(id);
    },
    accounts: async (_, __, { dataSources }) => {
      return dataSources.accountsAPI.getAccounts();
    },
    viewer: async (_, __, { dataSources, user }) => {
      if (user?.sub) {
        return dataSources.accountsAPI.getAccountById(user.sub);
      }
      return null;
    },
    bookings: async (_, __, { ctx, dataSources }) => {
      const { user } = ctx;
      if (!user) {
        throw new GraphQLError('No user found', { extensions: { code: 'NO_USER_FOUND' } });
      }
      const bookings = await dataSources.bookingsAPI.getBookingsForUser(user);
      return bookings;
    },
    listings: async (_, __, { ctx, dataSources }) => {
      const { user } = ctx;
      if (!user) throw new AuthenticationError('You must be logged in to view your listing');

      if (user.role === 'HOST') {
        const listings = await dataSources.listingsAPI.getListingsForHost(user.id);
        if (listings) {
          return listings;
        }
        throw new Error('No listings found for this host');
      } else {
        throw new GraphQLError('You are not authorized to view listings',{extensions:{
          code:'Unauthorizated'
        }});
      }
    },
  },

  Mutation: {
    createUser: async (_, { CreateUserInput }, { dataSources, userId }) => {
      try {
        const user = await dataSources.accountsAPI.getUser(userId);
        if (user.role !== 'Admin') {
          throw new AuthenticationError('Only admin can create a user');
        }
        const { name, password, email } = CreateUserInput;
        const newUser = await dataSources.accountsAPI.createUser({
          name,
          email,
          password,
        });
        return {
          code: 200,
          success: true,
          message: 'A user successfully created',
          user: newUser,
        };
      } catch (error) {
        return {
          code: 400,
          success: false,
          message: error.message,
        };
      }
    },


    createListing: async (_, { CreateListingInput }, { dataSources, hostId, locationId }) => {
      const { title, description, price } = CreateListingInput;
      try {
        if (!hostId) {
          throw new AuthenticationError('You do not have the right to create a listing');
        }
        if (!locationId) {
          throw new AuthenticationError('You must select a location');
        }
        const newListing = await dataSources.listingsAPI.createListing({
          title,
          description,
          price,
          locationId,
        });
        return {
          code: 200,
          success: true,
          message: 'A listing successfully created',
          listing: newListing,
        };
      } catch (error) {
        return {
          code: 400,
          success: false,
          message: error.message,
        };
      }
    },
  
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
      if (context.session) {
        context.session.destroy(err => {
          if (err) {
            throw new GraphQLError('Failed to terminate the session', { extensions: { code: 'FAILED_TO_TERMINATE_SESSION' } });
          }
        });
      }
      return true;
    },

    signIn: async (_, { input: { email, password } }, { dataSources }) => {
      if (email && password) {
        return dataSources.accountsAPI.login(email, password);
      }
      throw new GraphQLError('Email and password must be provided', { extensions: { code: 'EMAIL_PASSWORD_REQUIRED' } });
    },

    signUp: async (_, { signUpInput }, { dataSources }) => {
      const { email, password, name, nickname, role, inviteCode, picture } = signUpInput;
      if (role === 'HOST') {
        const isValidInviteCode = await validateInviteCode(inviteCode);
        if (!inviteCode || !isValidInviteCode) {
          return dataSources.accountsAPI.registerGuest(email, name, password, nickname, 'GUEST', picture);
        }
        return dataSources.accountsAPI.registerHost(email, name, password, nickname, 'HOST', picture);
      } else {
        return dataSources.accountsAPI.registerGuest(email, name, password, nickname, 'GUEST', picture);
      }
    },

    createAccount: async (_, { input: { email, password } }, { dataSources }) => {
      return dataSources.accountsAPI.createAccount(email, password);
    },
    deleteAccount: async (_, { id }, { dataSources }) => {
      return dataSources.accountsAPI.deleteAccount(id);
    },
    updateAccountEmail: async (_, { input: { id, email } }, { dataSources }) => {
      return dataSources.accountsAPI.updateAccountEmail(id, email);
    },
    updateAccountPassword: async (_, { input: { id, newPassword, password } }, { dataSources }) => {
      return dataSources.accountsAPI.updateAccountPassword(id, newPassword, password);
    }
  },

  User: {
    __resolveType(user) {
      if (user.role === 'HOST') {
        return 'Host';
      } else if (user.role === 'GUEST') {
        return 'Guest';
      }
      return null;
    },
  },

  Host: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    }
  },

  Guest: {
    __resolveReference: (user, { dataSources }) => {
      return dataSources.accountsAPI.getUser(user.id);
    }
  }
};

export default resolvers;