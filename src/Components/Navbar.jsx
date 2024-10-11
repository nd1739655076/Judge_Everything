// src/Components/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './HomePage/HomePage.css';

const Navbar = ({ isLoggedIn, username, greeting, handleLogout }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  return (
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
      {isLoggedIn && (
        <div className="currentUserStatus">
          <div className="greeting">
            {greeting} !
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
                      <a href="#"><FaBell /> Notification</a>
                    </div>
                  </li>
                  <li>
                    <div className="history">
                      <a href="#"><FaHistory /> History</a>
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
  );
};

export default Navbar;
