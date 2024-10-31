import React, { useState } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import styles from './LoginSignup.module.css';

import { Link } from 'react-router-dom';
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
        localStorage.setItem('authToken', response.data.statusToken);
        const checkFirstLoginResponse = await handleUserRequest({
          action: 'checkFirstLogin',
          username: username
        });
        if (checkFirstLoginResponse.data.success) {
          setErrorMessage("");
          setSuccessMessage(checkFirstLoginResponse.data.message);
          setTimeout(() => {
            navigate("/preferenceSurvey");
          }, 3000);
        }
        else {
          setErrorMessage("");
          setSuccessMessage("Login successful! Redirecting...");
          setTimeout(() => {
            navigate("/");
          }, 1000);
        }
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
    <div className={styles.container}>
        <div className={styles.logo}><img src={logo} alt="Logo" /></div>
        <div className={styles.header}>
          <h5 className={styles.slogan}>Bought or used Something? Judge it right now!</h5>
          <h3 className={styles.text}>{action === "Login" ? "Welcome Back!" : "Welcome, New User!"}</h3>
        </div>

        <div className={styles.inputs}>
            <div className={styles.username}>
                <div className={styles.label}>Username</div>
                <div className={styles.input}>
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
                <div className={styles.email}>
                    <div className={styles.label}>Email</div>
                    <div className={styles.input}>
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
            <div className={styles.password}>
                <div className={styles.label}>Password</div>
                <div className={styles.input}>
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
                <div className={styles.password}>
                    <div className={styles.label}>Re-enter Password</div>
                    <div className={styles.input}>
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
            <div className={styles.formActions}>
                <label>
                    <input type="checkbox" className={styles.checkbox} />
                    Remember Me
                </label>
                <span className={styles.forgotPassword}>
                  <Link to="/forgotPassword">Forgot Password</Link>
                </span>
            </div>
        )}
        <div className={styles.message}>
            {loading && <div className={styles.loadingMessage}>Loading...</div>}
            {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
        </div>
        <div className={styles.submitContainer}>
            {action === "Sign Up" ? (
                <div className={styles.submit} onClick={handleSignup}>Sign Up</div>
            ) : (
                <div className={styles.submit} onClick={handleLogin}>Login</div>
            )}
            <div className={`${styles.submit} ${styles.gray}`} onClick={handleModeSwitch}>
                {action === "Login" ? "Sign Up" : "Login"}
            </div>
        </div>
    </div>
  );
};

export default LoginSignup;
