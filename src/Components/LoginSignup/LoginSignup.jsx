import React, { useState } from "react";
import './LoginSignup.css'
import logo from '../LoginSignupAssets/logo.jpg';
import user_icon from '../LoginSignupAssets/user_icon.png';
import email_icon from '../LoginSignupAssets/email_icon.png';
import password_icon from '../LoginSignupAssets/password_icon.png';

const LoginSignup = () => {

    const [action, setAction] = useState("Login");

    return (
        <div className="container">

            <div className="logo">
              <img src={logo} alt=""></img>
            </div>

            <div className="header">
                <h5 className="slogan">Bought or used Something? Judge it right now!</h5>
                <h3 className="text">
                  {action==="Login"?"Welcome Back!":"Welcome, New User!"}
                </h3>
                {/* <div className="text">{action}</div> */}
            </div>

            <div className="inputs">        
                <div className="username">
                    <div className="label">
                      Username
                    </div>
                    <div className="input">
                        <img src={user_icon} alt="" />
                        <input type="text" id="username" placeholder="Name"/>
                    </div>
                </div>
                {action==="Login"?<div/>:
                <div className="email">
                    <div className="label">Email</div>
                    <div className="input">
                        <img src={email_icon} alt="" />
                        <input type="email" placeholder="Enter Email (Optional)"/>
                    </div>
                </div>}
                <div className="password">
                    <div className="label">Password</div>
                    <div className="input">
                        <img src={password_icon} alt="" />
                        <input type="password" placeholder="Enter Password"/>
                    </div>
                </div>
                {action==="Login"?<div/>:
                <div className="password">
                    <div className="label">Re-enter Password</div>
                    <div className="input">
                        <img src={password_icon} alt="" />
                        <input type="password" placeholder="Re-enter Password"/>
                    </div>
                </div>}
            </div>
            <div className="form-actions">
                <div className="checkbox-container">
                    <label>
                        <input type="checkbox" className="checkbox" />
                        Remember Me
                    </label>
                </div>
                {action==="Sign Up"?<div/>:<div className="forgot-password">
                    <span>Forgot password?</span>
                    </div>}
            </div>
            <div className="submit-container">
                <div className={action==="Login"?"submit gray":"submit"}
                 onClick={()=>{setAction("Sign Up")}}>Sign Up</div>
                <div className={action==="Sign Up"?"submit gray":"submit"}
                 onClick={()=>{setAction("Login")}}>Login</div>
            </div>

        </div>
  )

}

export default LoginSignup