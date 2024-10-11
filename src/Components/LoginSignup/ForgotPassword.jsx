import React, { useState } from "react";
// import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import '../LoginSignup/LoginSignup.css';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
// const nodemailer = require('nodemailer');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    // e.preventDefault();


    try {
      setError('');
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      const resetResponse = await handleUserRequest({
        action: 'reset',
        statusToken: null,
        email: email,
      });
      if (resetResponse.data.success) {
        console.log('success');
        setError('');
        setMessage('Password reset email sent! Check your inbox.\nRedirecting to Login page...');
      } else {
        setError(resetResponse.data.message);
      }

      setTimeout(() => {
        navigate("/loginSignup");
      }, 1000);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setMessage('');  // Clear the success message
    }
  };

  return (
    <div className="container" style={{ marginTop: '17%' }}>
      <div className="header">
        <h2 className="text">Forgot Password</h2>
      </div>
      <div className="inputs">
        <div className="email">
          <div className="label">Enter Your Email</div>
          <div className="input">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="submit-container">
          <button className="submit" onClick={handleForgotPassword}>
            Send Reset Link
          </button>
        </div>

        {message && <p className="signup-success">{message}</p>}
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;