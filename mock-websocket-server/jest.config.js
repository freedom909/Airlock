// jest.config.js  
export default {
    testEnvironment: 'node',
    transform: {
        '^.+\\.js$': 'babel-jest', // Use Babel to transform ESM  
    },
    moduleFileExtensions: ['js', 'json', 'node'],
};