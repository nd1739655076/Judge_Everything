import React, { useState } from "react";
import './HomePage.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory , FaCog } from 'react-icons/fa';
import logoImage from "../HomePageAssets/404.jpg";
//import iconEmail from "../HomePageAssets/404.jpg";
//import iconInstagram from "../HomePageAssets/404.jpg";
//import iconYoutube from "../HomePageAssets/404.jpg";
//import iconTwitter from "../HomePageAssets/404.jpg";

const Homepage = () => {

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
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
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Your Account</a>
          <a href="#">Support</a>
        </div>
        <div className="searchbar">
          <FaSearch/>
          <input type="text" placeholder="Search" />
        </div>
        <div className="menuContainer">
          <FaBars className="menuicon" onClick={toggleDropdown} />
          {isDropdownVisible && (
            <div className="dropdownMenu">
              <ul>
                <li>
                  <div className="userauth">
                    <Link to="/loginSignup"><FaUser /> Login/Register</Link>
                  </div>
                </li>
                <li>
                  <div className="notifcations">
                    <a href="#"><FaBell /> Notifaction</a>
                  </div>
                </li>
                <li>
                  <div className="notifcations">
                    <a href="#"><FaBell /> Notifaction</a>
                  </div>
                </li>
                <li>
                  <div className="historys">
                    <a href="#"><FaHistory /> History</a>
                  </div>
                </li>
                <li>
                  <div className="settings">
                    <Link to="/settings"><FaUser /> Settings</Link>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Create New Entry Section */}
      <section className="createNewEntry">
        <div className="createNewEntryContent">
          <h1>Judge Everything</h1>
          <p className="p1">Found in 2024</p>
          <p className="p2">Bought/Used something? Share it!</p>
          <Link to="/creatProductEntry">
            <button>Create a New Entry</button>
          </Link>
        </div>
        <div className="createNewEntryImage">
          <img src={logoImage} alt="Create a New Entry???" />
        </div>
      </section>

      {/* Create Most Popular Entries Section */}
      <section className="mostPopularEntries">
        <div className="mostPopularEntriesHeader">
          <h1>Ranking</h1>
          <h2>Most Popular Entries This Week</h2>
          <p>will update every Thursday 11:59 p.m. EST</p>
        </div>
        <div className="mostPopularEntriesGrid">
          <div className="mostPopularEntryCard">
            <img src="???.jpg" alt="???" />
            <h1>???</h1>
            <p>???</p>
            <a href="#">View</a>
          </div>
        </div>
        <div className="mostPopularLoadMore">
          <button>LOAD MORE ENTRIES</button>
        </div>
      </section>

      {/* Create Recommendation Entries Section */}
      <section className="recommendationEntries">
        <div className="recommendationEntriesHeader">
          <h1>Recommendations</h1>
          <h2>The Products You May Like...</h2>
          <p>Change your preference in your account setting anytime!</p>
        </div>
        <div className="recommendationEntriesGrid">
          <div className="recommendationEntryCard">
            <img src="???.jpg" alt="???" />
            <h1>???</h1>
            <p>???</p>
            <a href="#">View</a>
          </div>
        </div>
        <div className="recommendationLoadMore">
          <button>LOAD MORE ENTRIES</button>
        </div>
      </section>

    </div>

  );

};

export default Homepage;
