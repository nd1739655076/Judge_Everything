import React, { useState, useEffect } from "react";
import './ContactPage.css';
import clock_icon from '../ContactPageAssets/clock.png';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaCog, FaSignOutAlt} from 'react-icons/fa';
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";


const ContactPage = () => {

    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState("");
    const [username, setUsername] = useState("");
    const [greeting, setGreeting] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    useEffect(() => {
        const checkLoginStatus = async () => {
          const localStatusToken = localStorage.getItem('authToken');
          if (localStatusToken) {
            const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
            try {
              const response = await handleUserRequest({
                action: 'checkLoginStatus',
                statusToken: localStatusToken,
              });
              if (response.data.success) {
                setIsLoggedIn(true);
                setUserId(response.data.uid);
                setUsername(response.data.username);
              } else {
                setIsLoggedIn(false);
                localStorage.removeItem('authToken');
              }
            } catch (error) {
              setIsLoggedIn(false);
              localStorage.removeItem('authToken');
            }
          } else {
            setIsLoggedIn(false);
          }
        };
        const setTimeGreeting = () => {
          const now = new Date();
          const hour = now.getHours();
          let currentGreeting = "Good ";
          if (hour >= 5 && hour < 12) {
            currentGreeting += "morning";
          } else if (hour >= 12 && hour < 17) {
            currentGreeting += "afternoon";
          } else if (hour >= 17 && hour < 21) {
            currentGreeting += "evening";
          } else {
            currentGreeting += "night";
          }
          setGreeting(currentGreeting);
        };
    
        checkLoginStatus();
        setTimeGreeting();
    
        const intervalId = setInterval(() => {
          checkLoginStatus();
          setTimeGreeting();
        }, 5000);
        return () => clearInterval(intervalId);
      }, []);
      const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
      };
    const handleLogout = async () => {
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      try {
        const response = await handleUserRequest({
          action: 'logout',
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setUserId("");
          setUsername("");
          window.location.reload();
        }
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

    const handleSubmit = async() => {
        setErrorMessage("");
        if (!name.trim()) {
            setErrorMessage("Please enter a name.");
            return;
        }
        if (!email.trim()) {
            setErrorMessage("Please enter an email.");
            return;
        }
        if (!subject.trim()) {
            setErrorMessage("Please enter the subject of your message.");
            return;
        }
        if (!message.trim()) {
            setErrorMessage("Please enter your message.");
            return;
        }
        try {
            const dbref = collection(db, "contacts")
            await addDoc(dbref, {
                name: name,
                email: email,
                subject: subject,
                message: message,
              });
              alert('Message successfully submitted!');
              setName("");
              setEmail("");
              setSubject("");
              setMessage("");
        } catch (error) {
            alert(error.message);
        }
    };
  
    return (
  
        <div className="Contact Page">
      
            {/* Top Bar */}
            <div className="topbar">
                <div className="contactinfo">
                    <FaPhone /> (225) 555-0118 | <FaEnvelope /> song748@purdue.edu
                </div>
                <div className="subscribeinfo">
                    Subscribe with email to get newest product information! 🎉
                </div>
                <div className="socialicons">
                    <p>Follow Us :</p>
                    <a href="#"><FaInstagram /></a>
                    <a href="#"><FaYoutube /></a>
                    <a href="#"><FaTwitter /></a>
                </div>
            </div>
    
            {/* Navigation Bar */}
            <div className="navbar">
                <div className="logoTitle">
                    <h1>Judge Everything</h1>
                </div>
                <div className="navlinks">
                    <a href="/">Home</a>
                    <a href="#">About</a>
                    <a href="/contact">Support</a>
                </div>
                <div className="searchbar">
                    <FaSearch />
                    <input type="text" placeholder="Search" />
                </div>
                {isLoggedIn ? (
                <div className="currentUserStatus">
                    <div className="greeting">
                        {greeting}!
                    </div>
                    <div className="currentUserStatusInfo">
                        <FaUser />
                        <span className="username">{username}</span>
                        <FaSignOutAlt
                            onClick={handleLogout}
                            title="Logout"
                            className="logout-icon"
                        />
                    </div>
                </div>
                ) : (
                <div className="login-prompt">
                    <p>Please log in to access more feature</p>
                </div>
                )}
                <div className="menuContainer">
                    <FaBars className="menuicon step-1" onClick={toggleDropdown} />
                    {isDropdownVisible && (
                        <div className="dropdownMenu">
                        <ul>
                            {!isLoggedIn ? (
                            <li>
                                <div className="userauth">
                                <Link to="/loginSignup"><FaUser /> Login/Register</Link>
                                </div>
                            </li>
                            ) : (
                            <>
                            <li>
                                <div className="notifcations">
                                    <a href="#"><FaBell /> Notifaction</a>
                                </div>
                            </li>
                            <li>
                                <div className="historys">
                                    <Link to="/history"><FaHistory /> History</Link>
                                </div>
                            </li>
                            <li>
                                <div className="settings">
                                    <Link to="/accountSettings"><FaCog /> Your Account</Link>
                                </div>
                            </li>
                            </>
                            )}
                        </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Form */}
            <div className="contact_us_6">
                <div className="responsive-container-block container">
                    <div className="form-box">
                        <div className="container-block form-wrapper">
                        <div className="mob-text">
                            <p className="text-blk contactus-head">
                            Get in Touch
                            </p>
                            {/* <p className="text-blk contactus-subhead">
                            102 N Grant Street
                            </p> */}
                        </div>
                        <div className="responsive-container-block">
                            <div className="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-12 wk-ipadp-12">
                            <p className="text-blk input-title">
                                NAME
                            </p>
                            <input className="input" id="Name" placeholder="Please enter your name"
                                    value={name} onChange={(e) => setName(e.target.value)}/>
                            </div>
                            <div className="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-12 wk-ipadp-12">
                            <p className="text-blk input-title">
                                EMAIL
                            </p>
                            <input className="input" id="Email" placeholder="Please enter email"
                                    value={email} onChange={(e) => setEmail(e.target.value)}/>
                            </div>
                            <div className="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-12 wk-ipadp-12">
                            <p className="text-blk input-title">
                                SUBJECT
                            </p>
                            <input className="input" id="Subject" placeholder="Please enter subject"
                                    value={subject} onChange={(e) => setSubject(e.target.value)}/>
                            </div>
                            <div className="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-12 wk-ipadp-12">
                            <p className="text-blk input-title">
                                WHAT CAN WE HELP YOU WITH?
                            </p>
                            <textarea className="textinput" placeholder="Please enter your message"
                                    value={message} onChange={(e) => setMessage(e.target.value)} />
                            </div>
                        </div>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        <button className="submit-btn" onClick={handleSubmit}>
                            Submit
                        </button>
                        </div>
                    </div>
                    <div className="column2">
                    {/* class="responsive-cell-block wk-desk-7 wk-ipadp-12 wk-tab-12 wk-mobile-12" */}
                        <div className="map-part">
                            <p className="text-blk map-contactus-head">
                                Reach us at
                            </p>
                            <div className="phone text-box">
                                <img className="contact-svg" src="https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/ET21.jpg" />
                                <p className="contact-text">Phone: +1 (225) 555-0118</p>
                            </div>
                            <div className="mail text-box">
                                <img className="contact-svg" src="https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/ET22.jpg" />
                                <p className="contact-text">Email: song748@purdue.edu</p>
                            </div>
                            <div className="address text-box">
                                <img className="contact-svg" src="https://workik-widget-assets.s3.amazonaws.com/widget-assets/images/ET23.jpg" />
                                <p className="contact-text"> Address: 102 N Grant Street</p>
                            </div>
                            <div className="hour text-box">
                                <img className="contact-svg" src={clock_icon} />
                                
                                <p className="contact-text"> Working Hours: 10am-6pm </p>
                            </div>
                            <div className="social-media-links mob">
                                <a className="social-icon-link" href="#">
                                <img className="link-img image-block" src="https://workik-widget-assets.s3.amazonaws.com/Footer1-83/v1/images/Icon-twitter.png" />
                                </a>
                                <a className="social-icon-link" href="#">
                                <img className="link-img image-block" src="https://workik-widget-assets.s3.amazonaws.com/Footer1-83/v1/images/Icon-facebook.png" />
                                </a>
                                <a className="social-icon-link" href="#">
                                <img className="link-img image-block" src="https://workik-widget-assets.s3.amazonaws.com/Footer1-83/v1/images/Icon-google.png" />
                                </a>
                                <a className="social-icon-link" href="#">
                                <img className="link-img image-block" src="https://workik-widget-assets.s3.amazonaws.com/Footer1-83/v1/images/Icon-instagram.png" />
                                </a>
                            </div>
                        
                        </div>
                    </div>
                </div>
            </div>
        </div>
  
    );

}

export default ContactPage;