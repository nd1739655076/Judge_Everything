import React, { useState } from 'react';
import '../LoginSignup/LoginSignup.css';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
// import { httpsCallable } from 'firebase/functions';
const nodemailer = require('nodemailer');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();


    try {
      // const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      // const response = await handleUserRequest({
      //   action: 'reset',
      //   email: email,
      // });
      // await sendPasswordResetEmail(auth, email);
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'judge.everything404@gmail.com',
          pass: 'zfqw jgrr kkuq mrnh'
        }
      });
      
      var mailOptions = {
        from: 'judge.everything404@gmail.com',
        to: email,
        subject: 'Password Reset',
        text: 'That was easy!'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      setMessage('Password reset email sent! Check your inbox.\nRedirecting to Login page...');
      setError('');  // Clear any previous errors
      
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
      <form className="inputs" onSubmit={handleForgotPassword}>
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
          <button className="submit" type="submit">
            Send Reset Link
          </button>
        </div>

        {message && <p className="signup-success">{message}</p>}
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
};

export default ForgotPassword;