import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'; //change later
import './AdminHomePage.css';

import { Link } from 'react-router-dom';
// icon import
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminHomepage = () => {

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isHeadAdmin, setIsHeadAdmin] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const localStatusToken = localStorage.getItem('authToken');
      if (localStatusToken) {
        console.log("local status token:", localStatusToken);
        const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
        try {
          const response = await handleAdminRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
          if (response.data.success) {
            console.log("match");
            setIsLoggedIn(true);
            setAdminId(response.data.uid);
            setUsername(response.data.username);
            setIsHeadAdmin(response.data.headAdmin);
          } else {
            console.log("not match");
            console.log(response.data.message);
            setIsLoggedIn(false);
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.log("error verifying token");
          setIsLoggedIn(false);
          localStorage.removeItem('authToken');
        }
      } else {
        console.log("no local token");
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
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  const handleLogout = async () => {
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
      try {
        const response = await handleAdminRequest({
          action: 'logout',
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setAdminId("");
          setUsername("");
          setIsHeadAdmin(false);
          window.location.reload();
        }
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

  const [loading, setLoading] = useState(true);
  const db = getFirestore();


  return (

    <div className="homepage">

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
          <a href="/admin/regularHome">Home</a>
          <a href="#">Todo List</a>
          <a href="#">Finished Tasks</a>
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
              <span className="admin-title">{isHeadAdmin ? ("Head Admin "):("Admin ")}</span>
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
            <p>Please log in</p>
          </div>
        )}
        <div className="menuContainer">
          <FaBars className="menuicon" onClick={toggleDropdown} />
          {isDropdownVisible && (
            <div className="dropdownMenu">
              <ul>
                {!isLoggedIn ? (
                  <li>
                    <div className="adminauth">
                      <Link to="/admin"><FaUser /> Login </Link>
                    </div>
                  </li>
                ) : (
                  <>
                  {/* These links are not yet implemented! */}
                    <li>
                      <div className="notifcations">
                        <a href="#"><FaBell /> Notifaction</a>
                      </div>
                    </li>
                    <li>
                      <div className="settings">
                        {/* <Link to="/accountSettings"><FaCog /> Your Account</Link> */}
                        <Link to="#"><FaCog /> Your Account</Link>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

    </div>

  );

};

export default AdminHomepage;