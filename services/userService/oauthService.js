import axios from 'axios';
import UserRepository from '../repositories/userRepositories/localAuthRepository.js';
import TokenService from './tokenService.js';

import { RESTDataSource } from "@apollo/datasource-rest";

class OAuthService extends RESTDataSource {
    constructor({ tokenService, userRepository }) {
        super();
        this.tokenService = tokenService; // Injected TokenService
        this.userRepository = userRepository; // Injected UserRepository
    }

    async oAuthLogin(provider, accessToken) {
        return await this.handleOAuthLogin(provider, accessToken);
    }

    async loginWithProvider({ provider, token }) {
        const userInfo = await this.getUserInfoFromProvider(provider, token);

        // Check if user exists in the database
        let user = await this.userRepository.getUserByEmailFromDb(userInfo.email);

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
        const jwtToken = this.tokenService.generateToken({ userId: user._id.toString() });

        return {
            token: jwtToken,
            user,
        };
    }

    async getUserInfoFromProvider(provider, token) {
        let userInfo;

        switch (provider) {
            case 'google':
                userInfo = await this.getGoogleUserInfo(token);
                break;
            case 'facebook':
                userInfo = await this.getFacebookUserInfo(token);
                break;
            default:
                throw new Error('Unsupported OAuth provider');
        }

        return userInfo;
    }

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

    async getFacebookUserInfo(token) {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);

        if (response.status !== 200) {
            throw new Error('Error fetching user info from Facebook');
        }

        return response.data;
    }

    async handleOAuthLogin(provider, accessToken) {
        const userInfo = await this.getUserInfoFromProvider(provider, accessToken);
        const { email, name, picture } = userInfo;

        let user = await this.userRepository.getUserByEmailFromDb(email);

        if (!user) {
            user = await this.userRepository.save({
                email,
                name,
                provider,
                picture,
            });
        }

        const token = await this.tokenService.generateToken({ id: user._id, role: user.role });

        return {
            token,
            userId: user._id,
        };
    }



    async oAuthLogin(provider, accessToken) {
        return await this.handleOAuthLogin(provider, accessToken);
    }

    async loginWithProvider({ provider, token }) {
        const userInfo = await this.getUserInfoFromProvider(provider, token);

        // Check if user exists in the database
        let user = await this.userRepository.getUserByEmailFromDb(userInfo.email);

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
        const jwtToken = this.tokenService.generateToken({ userId: user._id.toString() });

        return {
            token: jwtToken,
            user,
        };
    }

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
            default:
                throw new Error('Unsupported OAuth provider');
        }

        return userInfo;
    }

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

    async getFacebookUserInfo(token) {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`);

        if (response.status !== 200) {
            throw new Error('Error fetching user info from Facebook');
        }

        return response.data;
    }

}

export default OAuthService;