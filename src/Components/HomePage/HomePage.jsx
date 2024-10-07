import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from 'firebase/firestore';
import './HomePage.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory , FaCog, FaSignOutAlt} from 'react-icons/fa';
import logoImage from "../HomePageAssets/404.jpg";
import Joyride from "react-joyride";

const Homepage = () => {

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [run, setRun] = useState(false);
  const [showTourAgain, setShowTourAgain] = useState(true);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  const steps = [
    {
      target: ".step-1",
      content: "You can view or modify your account information here"
    },
    {
      target: ".step-2",
      content: "Create new product entries here"
    },
    {
      target: ".step-3",
      content: "Have any doubts or want to give feedback? Click here!"
    },
    {
      target: ".step-4",
      content: "Brows Most Popular Entries Every Week"
    },
    {
      target: ".step-5",
      content: "Personalized recommendations, Just for YOU!"
    }
  ];
  useEffect(() => {
    const shouldRunTourAgain = localStorage.getItem("showTourAgain");
    setShowTourAgain(shouldRunTourAgain !== "false");
  }, []);
  const handleTourFinish = () => {
    localStorage.setItem("showTourAgain", "false");
    setShowTourAgain(false);
  }
  // useEffect(() => {
  //   const currentUser = auth.onAuthStateChanged(async (user) => {
  //     if (currentUser) {
  //       setIsLoggedIn(true);
  //       const currentUserRef = doc(db, 'User', user.idNum);
  //       const currentUserDoc = await getDoc(currentUserRef);
  //       if (currentUserDoc.exists()) {
  //         setUsername(currentUserDoc.data().nickname || currentUserDoc.data().username);
  //       }
  //     } else {
  //       setIsLoggedIn(false);
  //     }
  //   });
  //   return () => currentUser();
  // }, []);
  // useEffect(() => {
  //   const now = new Date();
  //   const hour = now.getHours();
  //   let currentGreeting = "Good ";
  //   if (hour >= 5 && hour < 12) {
  //     currentGreeting += "morning";
  //   } else if (hour >= 12 && hour < 17) {
  //     currentGreeting += "afternoon";
  //   } else if (hour >= 17 && hour < 21) {
  //     currentGreeting += "evening";
  //   } else {
  //     currentGreeting += "night";
  //   }
  //   setGreeting(currentGreeting);
  // }, []);
  // const handleLogout = async () => {
  //   try {
  //     await auth.signOut();
  //     window.location.reload();
  //   } catch (error) {
  //     console.error("Error logging out:", error);
  //   }
  // };

  return (

    <div className="homepage">
      {showTourAgain && (
        <button onClick={() => setRun(true)}>Start Tour</button>
      )}
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
          <a href="/">Home</a>
          <a href="#">About</a>
          <a href="/contact" className="step-3">Support</a>
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
              <FaUser /> {username} 
              <FaSignOutAlt
                //onClick={handleLogout}
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
                {/* {!isLoggedIn ? ( */}
                  <li>
                    <div className="userauth">
                      <Link to="/loginSignup"><FaUser /> Login/Register</Link>
                    </div>
                  </li>
                {/* ) : ( */}
                  <>
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
                      <div className="settings step-1">
                        <Link to="/accountSettings"><FaCog /> Your Account</Link>
                      </div>
                    </li>
                  </>
                {/* )} */}
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
            <button className="step-2">Create a New Entry</button>
          </Link>
        </div>
        <div className="createNewEntryImage">
          <img src={logoImage} alt="Create a New Entry???" />
        </div>
      </section>

      {/* Create Most Popular Entries Section */}
      <section className="mostPopularEntries step-4">
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
      <section className="recommendationEntries step-5">
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
      <Joyride steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      showProgress
      showSkipButton
      disableScrolling
      callback={data => {
        const { action } = data;
        if (
          action === "close" ||
          action === "skip" ||
          action === "finished"
        ) {
          setRun(false);
        }
      }}
      styles={{
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "#fff"
        },
        buttonNext: {
          backgroundColor: "#007bff"
        }
      }}
      onFinish={handleTourFinish}
      />
    </div>
    
  );

};

export default Homepage;
