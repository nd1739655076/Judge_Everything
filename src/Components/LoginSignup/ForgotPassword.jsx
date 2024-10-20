import React, { useState } from "react";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './ForgotPassword.css';
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
    setDisplay(false);
    setError('');
    setPassword('');
    setMessage(''); // clear current message
    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setMessage('Verifying you credentials...');

    try {

      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      console.log(username, email);
      const response = await handleUserRequest({
        action: 'retrievePassword',
        username: username,
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
        setMessage('');
        setError(response.data.message);
      }

    } catch (err) {
      setMessage('');
      setError(`Error: ${err.message}`);
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

        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
        {display && <p className="password">Your password is: {password}</p>}
      </div>
    </div>
  );
};

export default ForgotPassword;