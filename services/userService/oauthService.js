import axios from 'axios';
import UserRepository from '../repositories/userRepositories/localAuthRepository.js';
import TokenService from './tokenService.js';
import { RESTDataSource } from "@apollo/datasource-rest";

class OAuthService extends RESTDataSource {
    constructor({ tokenService, userRepository }) {
        super();
        if (!tokenService || !userRepository) {
            throw new Error("OAuthService requires tokenService and userRepository");
        }
        this.tokenService = tokenService;
        this.userRepository = userRepository;
    }

    async loginWithProvider({ provider, token }) {
        try {
            // Get user information from the OAuth provider
            const userInfo = await this.getUserInfoFromProvider(provider, token);

            // Check if the user exists in the database
            let user = await this.userRepository.getUserByEmailFromDb(userInfo.email);
            if (!user) {
                // Create a new user if not found
                user = await this.userRepository.save({
                    email: userInfo.email,
                    name: userInfo.name,
                    provider,
                    picture: userInfo.picture,
                });
            }

            // Generate JWT token
            const jwtToken = this.tokenService.generateToken({ userId: user._id.toString() });

            return { token: jwtToken, user };
        } catch (error) {
            console.error('Error in loginWithProvider:', error.message);
            throw new Error("Failed to log in with the specified provider");
        }
    }

    async validateProviderToken(provider, providerToken) {
        try {
            let url, response;

            switch (provider) {
                case 'google':
                    url = `https://oauth2.googleapis.com/tokeninfo?id_token=${providerToken}`;
                    response = await axios.get(url);
                    return response.data.aud === process.env.GOOGLE_CLIENT_ID;

                case 'facebook':
                    url = `https://graph.facebook.com/debug_token?input_token=${providerToken}&access_token=${process.env.FACEBOOK_APP_TOKEN}`;
                    response = await axios.get(url);
                    return response.data.data.is_valid;

                case 'X':
                    url = `https://api.twitter.com/2/users/me`;
                    response = await this.getXUserInfo(providerToken);
                    return response.status === 'valid';

                default:
                    throw new Error(`Unsupported OAuth provider: ${provider}`);
            }
        } catch (error) {
            console.error(`Error validating token for provider ${provider}:`, error.message);
            throw new Error("Failed to validate provider token");
        }
    }

    async getUserInfoFromProvider(provider, token) {
        try {
            switch (provider) {
                case 'google':
                    return await this.getGoogleUserInfo(token);
                case 'facebook':
                    return await this.getFacebookUserInfo(token);
                case 'X':
                    return await this.getXUserInfo(token);
                default:
                    throw new Error('Unsupported OAuth provider');
            }
        } catch (error) {
            console.error(`Error fetching user info from ${provider}:`, error.message);
            throw new Error('Failed to retrieve user information');
        }
    }

    async getGoogleUserInfo(token) {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status !== 200) {
            throw new Error('Error fetching user info from Google');
        }
        return response.data;
    }

    async getFacebookUserInfo(token) {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);
        if (response.status !== 200) {
            throw new Error('Error fetching user info from Facebook');
        }
        return response.data;
    }

    async getXUserInfo(token) {
        const response = await axios.get('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status !== 200) {
            throw new Error('Error fetching user info from X');
        }
        return response.data;
    }
}

export default OAuthService;
