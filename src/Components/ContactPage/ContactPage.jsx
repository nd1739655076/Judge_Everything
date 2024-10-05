import React, { useState } from "react";
//import './ContactPage.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory , FaCog } from 'react-icons/fa';

const ContactPage = () => {

    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const toggleDropdown = () => {
      setDropdownVisible(!isDropdownVisible);
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

            {/* main content */}
            <div class="container">
                <div class="content contact-wrap">
                {/* row align-items-stretch no-gutters contact-wrap */}
                    <div class="column">
                    {/* col-md-8 */}
                        <div class="column-content">
                        {/* form h-100 */}
                            <h3>Send us a message</h3>
                            <form class="contactForm" id="contactForm" name="contactForm">
                            {/* mb-5 method="post"*/}
                                <div class="row">
                                    <div class="form-field">
                                    {/* col-md-6 form-group mb-5 */}
                                    <label for="" class="form-label">Name *</label>
                                    {/* col-form-label" */}
                                    <input type="text" class="form-input" name="name" id="name" placeholder="Your name"/>
                                    {/* form-control */}
                                    </div>
                                    <div class="form-field">
                                    {/* col-md-6 form-group mb-5 */}
                                    <label for="" class="form-label">Email *</label>
                                    <input type="text" class="form-input" name="email" id="email"  placeholder="Your email"/>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="form-field">
                                    <label for="" class="form-label">Phone</label>
                                    <input type="text" class="form-input" name="phone" id="phone"  placeholder="Phone #"/>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="form-field-2">
                                    {/* col-md-12 form-group mb-5 */}
                                    <label for="message" class="col-form-label">Message *</label>
                                    <textarea class="form-input" name="message" id="message" cols="30" rows="4"  placeholder="Write your message"></textarea>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="btn">
                                    {/* col-md-12 form-group */}
                                    <input type="submit" value="Send Message" class="btn btn-primary rounded-0 py-2 px-4"/>
                                    <span class="submitting"></span>
                                    </div>
                                </div>
                            </form>

                            <div id="form-message-warning mt-4"></div> 
                            <div id="form-message-success">
                                Your message was sent, thank you!
                            </div>
                        </div>
                    </div>
                    <div class="column">
                        <div class="contact-info h-100">
                            <h3>Contact Information</h3>
                            <p class="mb-5">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Molestias, magnam!</p>
                            <ul class="list-unstyled">
                            <li class="d-flex">
                                <span class="wrap-icon icon-room mr-3"></span>
                                <span class="text">9757 Aspen Lane South Richmond Hill, NY 11419</span>
                            </li>
                            <li class="d-flex">
                                <span class="wrap-icon icon-phone mr-3"></span>
                                <span class="text">+1 (291) 939 9321</span>
                            </li>
                            <li class="d-flex">
                                <span class="wrap-icon icon-envelope mr-3"></span>
                                <span class="text">info@mywebsite.com</span>
                            </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
    
            
  
        </div>
  
    );

}

export default ContactPage;