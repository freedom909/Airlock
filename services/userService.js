import LocalAuthService from './userService/localAuthService.js';
import OauthService from './userService/oauthService.js';
import TokenService from './userService/tokenService.js';

class UserService {
    constructor({ mongodb }) {
        this.localAuthService = new LocalAuthService({ mongodb });
        this.oauthService = new OauthService({ mongodb });
        this.tokenService = new TokenService();
    }

    async registerUser(userData) {
        return await this.localAuthService.registerUser(userData);
    }

    async loginUser(email, password) {
        const user = await this.localAuthService.authenticateUser(email, password);
        return this.tokenService.generateToken(user);
    }

    async oauthLogin(provider, accessToken) {
        return await this.oauthService.handleOAuthLogin(provider, accessToken);
    }

    // Other user-related methods can be added here
    async findUserById(id) {
        // Simulate a real service method that fetches a user by ID  
        // In a real scenario, this would interact with your database  
    }
}

export default UserService;
