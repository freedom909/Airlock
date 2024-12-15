// /services/localAuthService.js
import axios from "axios"; // If you're using axios to communicate with your backend
import { sign } from "jsonwebtoken";

const API_URL = "http://localhost:3000/api/auth"; // Replace with your actual API URL

const localAuthService = {
    signUp: async (email, password) => {
        const response = await axios.post(`${API_URL}/signup`, { email, password });
        return response.data; // Or return something useful
    },
    signIn: async (email, password) => {
        const response = await axios.post(`${API_URL}/signin`, { email, password });
        return response.data; // The user data after successful login
    },
};

export default localAuthService;
