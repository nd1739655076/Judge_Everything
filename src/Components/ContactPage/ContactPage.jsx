import React, { useState } from "react";
import './ContactPage.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory} from 'react-icons/fa';
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";


const ContactPage = () => {

    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const toggleDropdown = () => {
      setDropdownVisible(!isDropdownVisible);
    };
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const handleSubmit = async() => {
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