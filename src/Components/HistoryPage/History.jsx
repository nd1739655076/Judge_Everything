import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './History.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter, } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaComments, FaCog} from 'react-icons/fa';

const History = () => {
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [greeting, setGreeting] = useState("");
    const [userId, setUserId] = useState("");
    const [uid, setUid] = useState("");

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
                console.log("set logged in")
                setIsLoggedIn(true);
                setUsername(response.data.username);
                setUserId(response.data.uid);
                await setUid(response.data.uid);
              } else {
                setIsLoggedIn(false);
                // setLoading(false);
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
        console.log("use effect is running");
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
    return (
        <div className="history-page">
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
                <Link to="/">Home</Link>
                <Link to="/contact">Support</Link>
            </div>
            <div className="searchbar">
                <FaSearch/>
                <input type="text" placeholder="Search" />
            </div>
            {isLoggedIn && (
                <div className="currentUserStatus">
                    <div className="greeting">
                    {greeting} !
                </div>
                <div className="currentUserStatusInfo">
                    <FaUser />
                    <span className="username">{username}</span>
                </div>
            </div>
            )}
            <div className="menuContainer">
              <FaBars className="menuicon" onClick={toggleDropdown} />
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
                          <div className="notifications">
                          <Link to={`/notification/${userId}`}> <FaBell /> Notifactions</Link>
                          </div>
                        </li>
                        <li>
                          <div className="message">
                          <Link to="/message"><FaComments /> Message</Link>
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
            <div className="history-buttons-container">
                <Link to="/history/create"><button className="history-button">Product Creation History</button></Link>
                <Link to="/history/review"><button className="history-button">Comment/Rating History</button></Link>
                <Link to="/history/browse"><button className="history-button">Browse History</button></Link>
            </div>
        </div>
      );
};

export default History;