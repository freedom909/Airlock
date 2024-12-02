import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const handleLoginSuccess = (response) => {
    console.log('Encoded JWT ID token:', response.credential);

    // Send the token to your server for verification
    fetch('/api/thirdPartyLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        token: response.credential,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log('Login success:', data))
      .catch((err) => console.error('Login error:', err));
  };

  const handleLoginFailure = () => {
    console.error('Login Failed');
  };

  return (
    <div>
      <h1>Login with Google</h1>
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={handleLoginFailure}
      />
    </div>
  );
};

export default Login;
