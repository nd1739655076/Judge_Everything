import React, { useState } from 'react';
import '../LoginSignup/LoginSignup.css';  // Import the CSS file for styling
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
      setError('');  // Clear any previous errors
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