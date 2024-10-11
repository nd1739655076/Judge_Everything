import React, { useState } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './LoginSignup.css'

import { useNavigate } from 'react-router-dom';
import logo from '../LoginSignupAssets/logo.jpg';
import user_icon from '../LoginSignupAssets/user_icon.png';
import email_icon from '../LoginSignupAssets/email_icon.png';
import password_icon from '../LoginSignupAssets/password_icon.png';

const LoginSignup = () => {
  const [action, setAction] = useState("Login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reenterPassword, setReenterPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setReenterPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };
  const handleModeSwitch = () => {
    setAction(action === "Login" ? "Sign Up" : "Login");
    resetForm();
  };
  const handleSignup = async () => {
    if (!username.trim()) {
      setErrorMessage("Username cannot be empty.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== reenterPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      const response = await handleUserRequest({
        action: 'generate',
        username: username,
        password: password,
        email: email,
      });
      setLoading(false);
      if (response.data.success) {
        console.log("Sign up successful");
        setErrorMessage("");
        setSuccessMessage(response.data.message);
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error signing up:', error.message);
      setErrorMessage("An error occurred during signup. Please try again.");
    }
  };
  const handleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      const response = await handleUserRequest({
        action: 'login',
        username: username,
        password: password,
      });
      setLoading(false);
      if (response.data.success) {
        console.log("Login successful");
        localStorage.setItem('authToken', response.data.statusToken);
        setErrorMessage("");
        setSuccessMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error logging in:', error.message);
      setErrorMessage("Incorrect username or password.");
    }
  };

  return (
    <div className="container">
        <div className="logo"><img src={logo} alt="Logo" /></div>
        <div className="header">
          <h5 className="slogan">Bought or used Something? Judge it right now!</h5>
          <h3 className="text">{action === "Login" ? "Welcome Back!" : "Welcome, New User!"}</h3>
        </div>

        <div className="inputs">        
            <div className="username">
                <div className="label">Username</div>
                <div className="input">
                    <img src={user_icon} alt="User Icon" />
                    <input 
                        type="text" 
                        placeholder="Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} 
                    />
                </div>
            </div>
            {action === "Sign Up" && (
                <div className="email">
                    <div className="label">Email</div>
                    <div className="input">
                        <img src={email_icon} alt="Email Icon" />
                        <input 
                            type="email" 
                            placeholder="Enter Email (Optional)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>
                </div>
            )}
            <div className="password">
                <div className="label">Password</div>
                <div className="input">
                    <img src={password_icon} alt="Password Icon" />
                    <input 
                        type="password" 
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
            </div>
            {action === "Sign Up" && (
                <div className="password">
                    <div className="label">Re-enter Password</div>
                    <div className="input">
                        <img src={password_icon} alt="Password Icon" />
                        <input 
                            type="password" 
                            placeholder="Re-enter Password"
                            value={reenterPassword}
                            onChange={(e) => setReenterPassword(e.target.value)} 
                        />
                    </div>
                </div>
            )}
        </div>
        {action === "Login" && (
            <div className="form-actions">
                <label>
                    <input type="checkbox" className="checkbox" />
                    Remember Me
                </label>
            </div>
        )}
        <div className="message">
            {loading && <div className="loading-message">Loading...</div>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
        <div className="submit-container">
            {action === "Sign Up" ? (
                <div className="submit" onClick={handleSignup}>Sign Up</div>
            ) : (
                <div className="submit" onClick={handleLogin}>Login</div>
            )}
            <div className="submit gray" onClick={handleModeSwitch}>
                {action === "Login" ? "Sign Up" : "Login"}
            </div>
        </div>
    </div>
);
};

export default LoginSignup