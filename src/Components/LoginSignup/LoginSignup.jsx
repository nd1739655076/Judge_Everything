import React, { useState } from "react";
import './LoginSignup.css';
import logo from '../LoginSignupAssets/logo.jpg';
import user_icon from '../LoginSignupAssets/user_icon.png';
import email_icon from '../LoginSignupAssets/email_icon.png';
import password_icon from '../LoginSignupAssets/password_icon.png';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';

const LoginSignup = () => {
    const [action, setAction] = useState("Login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [reenterPassword, setReenterPassword] = useState("");
    const [isSignupSuccessful, setIsSignupSuccessful] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [passwordLengthError, setPasswordLengthError] = useState(false);
    const [usernameError, setUsernameError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [loginError, setLoginError] = useState("");
    const [loginSuccessful, setLoginSuccessful] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleModeSwitch = (mode) => {
        setAction(mode);
        setUsername("");
        setEmail("");
        setPassword("");
        setReenterPassword("");
        setIsSignupSuccessful(false);
        setPasswordError(false);
        setPasswordLengthError(false);
        setUsernameError(false);
        setEmailError(false);
        setLoginError("");
        setErrorMessage("");
    };

    const handleSignup = async (username, email, password, reenterPassword) => {
        setUsernameError(false);
        setEmailError(false);
        setErrorMessage("");

        if (password.length < 6) {
            setPasswordLengthError(true);
            return;
        } else {
            setPasswordLengthError(false);
        }

        if (password !== reenterPassword) {
            setPasswordError(true);
            setReenterPassword("");
            return;
        }

        try {
            const usersRef = collection(db, 'Users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setUsernameError(true);
                setErrorMessage("Username has already existed. Please try a new one.");
                return;
            }

            const generatedEmail = email || `${username}@example.com`;
            const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, password);
            const user = userCredential.user;

            await setDoc(doc(db, "Users", user.uid), {
                username: username,
                email: email || "",
                password: password,
                "browse history ID": "",
                "product history ID": "",
                "review history ID": ""
            });

            setIsSignupSuccessful(true);
            setPasswordError(false);
            console.log("Sign up successful");
        } catch (error) {
            console.error("Error signing up:", error.code, error.message);
            if (error.code === 'auth/email-already-in-use') {
                setEmailError(true);
                setErrorMessage("Email has already existed. You can retry with a new email or login.");
            } else {
                setErrorMessage("An error occurred. Please try again.");
            }
        }
    };

    const handleLogin = async (username, password) => {
        setLoginError("");
        setLoginSuccessful(false);
        try {
            const usersRef = collection(db, 'Users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setLoginError("Incorrect username or password.");
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            await signInWithEmailAndPassword(auth, userData.email, password);
            setLoginSuccessful(true);
            console.log("Login successful");
        } catch (error) {
            setLoginError("Incorrect username or password. Click forgot password if you need to reset.");
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
                    <div className="label">
                        Username
                        {usernameError && <span className="error-message">Username has already existed. Please try a new one.</span>}
                    </div>
                    <div className={`input ${usernameError ? 'error-border' : ''}`}>
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
                        <div className="label">
                            Email
                            {emailError && <span className="error-message">Email has already existed. Please try a new email or login.</span>}
                        </div>
                        <div className={`input ${emailError ? 'error-border' : ''}`}>
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
                    <div className="label">
                        Password
                        {passwordLengthError && <span className="error-message">Password must be longer than 6 characters.</span>}
                    </div>
                    <div className={`input ${passwordLengthError ? 'error-border' : ''}`}>
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
                        <div className="label">
                            Re-enter Password
                            {passwordError && <span className="error-message">Passwords do not match. Please try again.</span>}
                        </div>
                        <div className={`input ${passwordError ? 'error-border' : ''}`}>
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

                    <span className="forgot-password">
                        <Link to="/forgotPassword">Forgot Password</Link>
                    </span>
                </div>
            )}

            <div className="message">
                <div className="error">
                    {action === "Login" && loginError && (
                        <p className="login-error">{loginError}</p>
                    )}
                    {action === "Sign Up" && !isSignupSuccessful && (
                        <p className="signup-error">{errorMessage}</p>
                    )}
                </div>
                <div className="success">
                    {action === "Login" && !loginError && loginSuccessful && (
                        <p className="login-success">Login Successful!</p>
                    )}
                    {action === "Sign Up" && isSignupSuccessful && (
                        <p className="signup-success">Sign Up Successful!</p>
                    )}
                </div>
            </div>
            <div className="submit-container">
                {action === "Sign Up" ? (
                    <div className="submit" onClick={() => handleSignup(username, email, password, reenterPassword)}>Sign Up</div>
                ) : (
                    <div className="submit" onClick={() => handleLogin(username, password)}>Login</div>
                )}
                {action === "Login" ? (
                    <div className="submit gray" onClick={() => handleModeSwitch("Sign Up")}>Sign Up</div>
                ) : (
                    <div className="submit gray" onClick={() => handleModeSwitch("Login")}>Login</div>
                )}
            </div>
        </div>
    );
};

export default LoginSignup;