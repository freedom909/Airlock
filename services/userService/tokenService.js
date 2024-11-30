import pkg from 'jsonwebtoken';
const { sign, verify, decode } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Secret key for signing tokens (replace this with your actual secret)
const secretKey = process.env.JWT_SECRET || 'good';

// Function to generate JWT token

class TokenService {
    constructor({ secretKey, expiresIn }) {
        this.secretKey = secretKey;
        this.expiresIn = expiresIn || '1h';
    }

    async generateToken(payload) {
        return sign(payload, this.secretKey, { expiresIn: this.expiresIn });
    }

    // Verify JWT Token
    async verifyToken(token) {
        try {
            return verify(token, this.secretKey);
        } catch (error) {
            throw new Error("Invalid or expired token");
        }
    }

    // Decode JWT Token without verifying (useful for inspecting the token)
    async decodeToken(token) {
        return decode(token);
    }
}

export default TokenService;
