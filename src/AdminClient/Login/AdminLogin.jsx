import React, { useState } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './AdminLogin.css';

import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import logo from '../LoginAssets/logo.jpg';
import { RiAdminLine, RiLockPasswordLine } from "react-icons/ri";


const AdminLogin = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
  
    const resetForm = () => {
      setUsername("");
      setPassword("");
      setErrorMessage("");
      setSuccessMessage("");
    };
    
    const handleLogin = async () => {
      setErrorMessage("");
      if (!username.trim()) {
        setErrorMessage("Please enter your username.");
        return;
      }
      if (!password.trim()) {
        setErrorMessage("Please enter your password.");
        return;
      }
      try {
        setLoading(true);
        setErrorMessage("");
        const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
        const response = await handleAdminRequest({
          action: 'login',
          username: username,
          password: password,
        });
        setLoading(false);
        if (response.data.success) {
          localStorage.setItem('authToken', response.data.statusToken);
          setErrorMessage("");
          setSuccessMessage("Login successful! Redirecting...");
          setTimeout(() => {
            navigate("/admin/regularHome");
          }, 500);
        } else {
          setErrorMessage(response.data.message);
        }
      } catch (error) {
        setLoading(false);
        console.error('Error logging in:', error.message);
        setErrorMessage("Incorrect username or password.");
      }
    };
    return(
        <div className="admin-login-container">
            <div className="logo"><img src={logo} alt="Logo" /></div>
            <div className="header">
            <h3 className="text">Admin Login</h3>
            </div>

            <div className="admin-login-inputs">
                <div className="admin-username">
                    <div className="admin-username-label">Username</div>
                    <div className="admin-username-input">
                        <RiAdminLine />
                        <input 
                            type="text" 
                            placeholder="Name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="admin-password">
                    <div className="admin-password-label">Password</div>
                    <div className="admin-password-input">
                        <RiLockPasswordLine />
                        <input 
                            type="password" 
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>
                </div>
            </div>
                {/* <div className="admin-form-actions">
                    <label>
                        <input type="checkbox" className={styles.checkbox} />
                        Remember Me
                    </label>
                    <span className={styles.forgotPassword}>
                    <Link to="/forgotPassword">Forgot Password</Link>
                    </span>
                </div> */}
            <div className="admin-login-message">
                {loading && <div className="loadingMessage">Loading...</div>}
                {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                {successMessage && <p className="successMessage">{successMessage}</p>}
            </div>
            <div className="admin-submit-container">
                <div className="admin-login-submit" onClick={handleLogin}>Login</div>
            </div>
        </div>

    );
};
export default AdminLogin;