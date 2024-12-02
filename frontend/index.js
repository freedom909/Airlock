import React from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './app';
import dotenv from 'dotenv';

dotenv.config();
const container = document.getElementById('root');
const root = createRoot(container);
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID environment variable');
}

root.render(
  <GoogleOAuthProvider clientId={CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
