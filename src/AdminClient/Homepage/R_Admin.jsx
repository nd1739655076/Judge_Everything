import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './HeadAdminHomePage.css';
import './R_Admin.css';

import { Link } from 'react-router-dom';
// icon imports
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaSignOutAlt, FaCog } from 'react-icons/fa';

const AdminHomepage = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isHeadAdmin, setIsHeadAdmin] = useState(false);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [dailyTasks, setDailyTasks] = useState(20);
  const [reportQueue, setReportQueue] = useState([]);

  // Fetch login status and greeting
  useEffect(() => {
    const checkLoginStatus = async () => {
      const localStatusToken = localStorage.getItem('authToken');
      if (localStatusToken) {
        const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
        try {
          const response = await handleAdminRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
          if (response.data.success) {
            setIsLoggedIn(true);
            setAdminId(response.data.uid);
            setUsername(response.data.username);
            setIsHeadAdmin(response.data.headAdmin);
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
      const greetings = ["Good night", "Good morning", "Good afternoon", "Good evening"];
      const index = hour >= 5 && hour < 12 ? 1 : hour >= 12 && hour < 17 ? 2 : hour >= 17 && hour < 21 ? 3 : 0;
      setGreeting(greetings[index]);
    };

    checkLoginStatus();
    setTimeGreeting();

    const intervalId = setInterval(() => {
      checkLoginStatus();
      setTimeGreeting();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch today's tasks and report queue
  useEffect(() => {
    if (isLoggedIn) {
      fetchTodayTasks();
      fetchReportQueue();
    }
  }, [isLoggedIn]);

  const fetchTodayTasks = async () => {
    const handleAdminTasksRequest = httpsCallable(functions, 'handleAdminTasksRequest');
    try {
      const response = await handleAdminTasksRequest({ adminId, action: 'getTodayTasks' });
      if (response.data.success) {
        setTasksCompleted(response.data.tasksCompleted);
        setDailyTasks(response.data.dailyTasks);
      }
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
    }
  };

  const fetchReportQueue = async () => {
    const handleAdminTasksRequest = httpsCallable(functions, 'handleAdminTasksRequest');
    try {
      const response = await handleAdminTasksRequest({ action: 'getReportQueue' });

      console.log("API Response:", response);
      if (response.data.success) {
        setReportQueue(response.data.queue);
      }
    } catch (error) {
      console.error("Error fetching report queue:", error);
    }
  };

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
              <span className="admin-title">{isHeadAdmin ? "Head Admin" : "Admin"}</span>
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
                    <li>
                      <div className="notifcations">
                        <a href="#"><FaBell /> Notification</a>
                      </div>
                    </li>
                    <li>
                      <div className="settings">
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

      {/* Main Content */}
      <div className="main-content">
        <div className="today-tasks">
          <h2>Today's Tasks</h2>
          <p>{tasksCompleted}/{dailyTasks}</p>
        </div>

        <div className="report-queue">
          <h2>Report Queue</h2>
          {reportQueue.length > 0 ? (
            reportQueue.map(product => (
              <div key={product.id} className="report-item">
                <img src={product.productImage} alt={product.productName} className="product-image" />
                <div className="product-info">
                  <div className="product-name"><strong>Product Name:</strong> {product.productName}</div>
                  <div className="product-description"><strong>Description:</strong> {product.description}</div>
                  <div className="product-creator"><strong>Creator:</strong> {product.creator}</div>
                  <div className="product-comments"><strong>Comments:</strong> {product.commentList?.length || 0}</div>
                  <div className="product-parameters">
                    <strong>Parameters:</strong>
                    {product.parametorList?.length > 0 ? (
                      <ul>
                        {product.parametorList.map((param, index) => (
                          <li key={index}>{param || "N/A"}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>N/A</p>
                    )}
                  </div>
                  <div className="product-tags">
                    <strong>Tags:</strong> {Array.isArray(product.tagList) ? product.tagList.join(", ") : "N/A"}
                  </div>
                  <div className="product-subtags">
                    <strong>Subtags:</strong> {Array.isArray(product.subtagList) ? product.subtagList.join(", ") : "N/A"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No reports to review.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHomepage;
