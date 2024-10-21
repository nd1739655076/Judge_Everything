import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './History.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory} from 'react-icons/fa';


const History = () => {
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [greeting, setGreeting] = useState("");

    const [modalIsOpen, setModalIsOpen] = useState(false);


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
                    <Link to="">About</Link>
                    <Link to="/contact">Support</Link>
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
                            <div className="historys">
                            <a href="#"><FaHistory /> History</a>
                            </div>
                        </li>
                        <li>
                            <div className="settings">
                            <Link to="/accountSetting"><FaUser /> Your Account</Link>
                            </div>
                        </li>
                    </ul>
                </div>
                )}
            </div>
        </div>
      {/* Product Entry Creation History */}
      <div className="product-history-container">
          <h1>Product Entry Creation History</h1>
          {/* List of Product Entry Cards */}
          <section className="product-history-content">
            <div className="product-cards">
              {[1, 2, 3].map((item) => (
                <div className="product-card" key={item}>
                  
                    <div className="product-img">
                      {/* Image Placeholder */}
                    </div>
                    <div>
                      <h2>Product Name</h2>
                      <p>Description of product. </p>
                      <button>View</button>
                    </div>
                  
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="paging">
              <button>&larr; Prev</button>
              <span>1</span>
              <span>2</span>
              <span>...</span>
              <span>68</span>
              <button>Next &rarr;</button>
            </div>
          </section>
      </div>

      {/* Reviews (Comment/Rate) History */}
      <div className="review-history-container">
          <section>
            <h1>Reviews History</h1>
            <div className="review-cards">
              {[1, 2, 3].map((review) => (
                <div className="review-history-card" key={review}>
                  <div className="review-content">
                    <div>
                      {/* Star rating placeholder */}
                      <p>⭐⭐⭐⭐⭐</p>
                      <h3>Review title</h3>
                      <p>Review body</p>
                      <p>
                        <img
                          src="https://via.placeholder.com/40"
                          alt="Reviewer avatar"
                          
                        />
                        Reviewer name
                      </p>
                      <p>Date</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            <div className="paging">
              <button>&larr; Prev</button>
              <span>1</span>
              <span>2</span>
              <span>...</span>
              <span>68</span>
              <button>Next &rarr;</button>
            </div>
          </section>
      </div>
    </div>
  );
};

export default History;