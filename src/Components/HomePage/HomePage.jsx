import React, { useState } from "react";
import './HomePage.css';

import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
//import iconPhone from "../HomePageAssets/404.jpg";
//import iconEmail from "../HomePageAssets/404.jpg";
//import iconInstagram from "../HomePageAssets/404.jpg";
//import iconYoutube from "../HomePageAssets/404.jpg";
//import iconTwitter from "../HomePageAssets/404.jpg";

const Homepage = () => {

  return (

    <div className="homepage">
    
      {/* topbar */}
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

    </div>

  );

};

export default Homepage;
