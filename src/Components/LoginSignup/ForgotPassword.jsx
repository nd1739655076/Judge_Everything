import React, { useState } from "react";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import '../LoginSignup/ForgotPassword.css';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
// import { httpsCallable } from 'firebase/functions';
// const nodemailer = require('nodemailer');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [display, setDisplay] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    // e.preventDefault();
    setError('');
    setPassword('');
    setMessage('');
    setDisplay(false)

    try {

      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      console.log(username, email);
      const response = await handleUserRequest({
        action: 'retrieve',
        usename: username,
        email: email, 
      });
      console.log("response:", response.data);
      if (response.data.success) {
        console.log('success');
        setError('');
        setMessage('Your credentials have been verified!');
        setPassword(response.data.password);
        setDisplay(true);
      } else {
        setError(response.data.message);
      }

    } catch (err) {
      setError(`Error: ${err.message}`);
      setMessage('');  // Clear the success message
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2 className="text">Forgot Password</h2>
      </div>
      <div className="inputs">
        <div className="username">
            <div className="label">Enter Your Username</div>
            <div className="input">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
        </div>
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
            Retrieve Password
          </button>
          <button className="back" onClick={() => navigate('/LoginSignup')}>
            Back to Login
          </button>
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <div className="success-message">Your password is: {password}</div>
      </div>
    </div>
  );
};

export default ForgotPassword;