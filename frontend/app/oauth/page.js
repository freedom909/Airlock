"use client"
import { useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";
import TwitterLogin from "react-twitter-login";
import dayjs from "dayjs";

const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID; // Add your Facebook App ID here
const twitterConsumerKey = process.env.NEXT_PUBLIC_TWITTER_CONSUMER_KEY; // Add your Twitter Consumer Key here
const twitterConsumerSecret = process.env.NEXT_PUBLIC_TWITTER_CONSUMER_SECRET; // Add your Twitter Consumer Secret here

export default function OAuth() {
    const [authToken, setAuthToken] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [time, setTime] = useState(null);
    const [date, setDate] = useState("");

    useEffect(() => {
        setIsClient(true);
        setTime(Date.now());
        setDate(dayjs().format("YYYY-MM-DD"));
    }, []);

    // Google Login Success
    const handleGoogleSuccess = (response) => {
        const token = response.credential;
        setAuthToken(token);
        console.log("Google Login Success:", response);
    };

    // Google Login Error
    const handleGoogleError = () => {
        console.error("Google Login Failed");
    };

    // Facebook Login Success
    const handleFacebookResponse = (response) => {
        console.log("Facebook Login Success:", response);
        // You can use response.accessToken to make API requests
    };

    // Twitter Login Success
    const handleTwitterResponse = (response) => {
        console.log("Twitter Login Success:", response);
        // You can use response.oauth_token to make API requests
    };

    if (!isClient || !time || !date) return null;

    return (
        <GoogleOAuthProvider clientId={googleId}>
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-xl font-bold mb-4">OAuth Login</h1>

                {/* Google Login */}
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                />

                {/* Facebook Login */}
                <FacebookLogin
                    appId={facebookAppId}
                    autoLoad={false}
                    fields="name,email,picture"
                    callback={handleFacebookResponse}
                    cssClass="facebook-login-button"
                    icon="fa-facebook"
                />

                {/* Twitter Login */}
                <TwitterLogin
                    authCallback={handleTwitterResponse}
                    consumerKey={twitterConsumerKey}
                    consumerSecret={twitterConsumerSecret}
                    buttonTheme="dark"
                />
            </div>
        </GoogleOAuthProvider>
    );
}
