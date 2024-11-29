// infrastructure/DB/initUserContainer.js
import { createContainer, asClass, asValue } from 'awilix';
import UserRepository from '../repositories/userRepository.js';
import LocalAuthService from '../userService/localAuthService.js';
import OAuthService from '../userService/oAuthService.js';
import TokenService from '../userService/tokenService.js';
import connectToMongoDB from './connectMongoDB.js';

const initUserContainer = async () => {
    const mongodb = await connectToMongoDB();
    const container = createContainer();

    container.register({
        mongodb: asValue(mongodb),
        userRepository: asClass(UserRepository).singleton(),

        secretKey: asValue(process.env.JWT_SECRET),
        localAuthService: asClass(LocalAuthService).singleton(), // Ensure this line exists

    });

    return container;
};

export default initUserContainer;

