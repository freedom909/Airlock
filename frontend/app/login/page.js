"use client"
import { useState } from "react";
import { useRouter } from 'next/navigation';  // To navigate after successful login/signup
import localAuthService from "../services/userService/localAuthService"; // Adjust path as needed

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                await localAuthService.signUp(email, password);
                alert("Sign up successful!");
            } else {
                await localAuthService.signIn(email, password);
                alert("Login successful!");
                router.push("/dashboard"); // Adjust the route to your dashboard or intended page
            }
        } catch (err) {
            setError(err.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">{isSignUp ? "Sign Up" : "Login"}</h1>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-64">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="p-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="p-2 border rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
                <button
                    type="submit"
                    className={`p-2 rounded text-white ${loading ? "bg-gray-500" : "bg-blue-500"}`}
                    disabled={loading}
                >
                    {loading ? "Loading..." : isSignUp ? "Sign Up" : "Login"}
                </button>
            </form>
            <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="mt-4 text-blue-500 underline"
            >
                {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}

            </button>
        </div>
    );
}
