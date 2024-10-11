import React from 'react';
import './HomePage/HomePage.css';

import {
    FaPhone,
    FaEnvelope,
    FaInstagram,
    FaYoutube,
    FaTwitter
} from 'react-icons/fa';

const TopBar = ({ loggedInUser }) => {
    return (
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
            {loggedInUser && (
                <div className="currentUserStatus">
                    <div className="greeting">
                        Hello, {loggedInUser.username}!
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopBar;
