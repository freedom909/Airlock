import axios from 'axios';
import UserRepository from '../../services/repositories/userRepositories/localAuthRepository.js';
import tokenService from './tokenService.js';

class OAuthService {
    constructor({ mongodb }) {
        this.userRepository = new UserRepository({ mongodb });
    }

    // OAuth login with third-party provider
    async loginWithProvider({ provider, token }) {
        const userInfo = await this.getUserInfoFromProvider(provider, token);

        // Check if user exists in the database
        let user = await this.userRepository.findUserByProvider({
            email: userInfo.email,
            provider,
        });

        if (!user) {
            // If user doesn't exist, create a new one
            user = await this.userRepository.save({
                email: userInfo.email,
                name: userInfo.name,
                provider,  // Save provider info (e.g., Google, Facebook)
                picture: userInfo.picture,
            });
        }

        // Generate a JWT token
        const jwtToken = tokenService.generateToken({ userId: newUserser._id.toString() });

        return {
            token: jwtToken,
            user,
        };
    }

    // Fetch user info from the OAuth provider (Google, Facebook, etc.)
    async getUserInfoFromProvider(provider, token) {
        let userInfo;

        switch (provider) {
            case 'google':
                userInfo = await this.getGoogleUserInfo(token);
                break;
            case 'facebook':
                userInfo = await this.getFacebookUserInfo(token);
                break;
            // Add more providers here
            case 'x':
                userInfo = await this.twitterUserInfo(token);
            default:
                throw new Error('Unsupported OAuth provider');
        }

        return userInfo;
    }

    // Get user info from Google
    async getGoogleUserInfo(token) {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status !== 200) {
            throw new Error('Error fetching user info from Google');
        }

        return response.data;
    }

    // Get user info from Facebook
    async getFacebookUserInfo(token) {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);

        if (response.status !== 200) {
            throw new Error('Error fetching user info from Facebook');
        }

        return response.data;
    }

    async handleOAuthLogin(provider, accessToken) {
        // Fetch user information from the OAuth provider using the accessToken
        const userInfo = await this.getUserInfoFromProvider(provider, accessToken);

        // Extract relevant user information from the provider's response
        const { email, name, picture } = userInfo;

        // Check if the user already exists in the database
        let user = await this.userRepository.getUserByEmailFromDb(email);

        // If the user does not exist, create a new one
        if (!user) {
            user = await this.userRepository.save({
                email,
                name,
                provider,
                picture,
            });
        }

        // Generate an authentication token for the user
        const token = await this.tokenService.generateToken({ id: user._id, role: user.role });

        // Return the token and userId as the response
        return {
            token,
            userId: user._id,
        };
    }


}

export default OAuthService;
