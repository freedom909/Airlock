import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

class TokenService {
    constructor({ secretKey, expiresIn }) {
        this.secretKey = secretKey;
        this.expiresIn = expiresIn || '1h';
    }

    generateToken(payload) {
        return sign(payload, this.secretKey, { expiresIn: this.expiresIn });
    }


    // Generate JWT Token
    generateToken(user) {
        return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }

    // Verify JWT Token
    verifyToken(token) {
        try {
            return verify(token, this.secretKey);
        } catch (error) {
            throw new Error("Invalid or expired token");
        }
    }

    // Decode JWT Token without verifying (useful for inspecting the token)
    decodeToken(token) {
        return decode(token);
    }
}

export default TokenService;
