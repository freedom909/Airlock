"use client";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";

import dayjs from "dayjs";


const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function OAuth() {
    const [date, setDate] = useState("");
    const [authToken, setAuthToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        if (!googleId) {
            console.error("Missing GOOGLE_CLIENT_ID environment variable");
        }

        setDate(dayjs().format("YYYY-MM-DD"));

        // Parse the token from the URL hash
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const token = hashParams.get("access_token");
        if (token) {
            setAuthToken(token);
        }
    }, []);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!authToken) return;

            try {
                const response = await fetch(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }
                );
                const userData = await response.json();
                setUserInfo(userData);
                alert(`Hello, ${userData.name || "User"}!`);
            } catch (error) {
                console.error("Error fetching user info:", error);
            }
        };

        fetchUserInfo();
    }, [authToken]);

    return (
        <GoogleOAuthProvider clientId={googleId}>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-xl font-bold mb-4">Google OAuth</h1>
                <GoogleLogin
                    onSuccess={(response) => {
                        console.log("Login Success:", response);
                    }}
                    onError={() => {
                        console.error("Login Failed");
                    }}
                />
                {authToken && <p>Access Token: {authToken}</p>}
                {userInfo && (
                    <div>
                        <p>Welcome, {userInfo.name}</p>
                        <p>Email: {userInfo.email}</p>
                    </div>
                )}
            </div>
        </GoogleOAuthProvider>
    );
}
