import React, { useState, useEffect } from "react";
import './HomePage.css';
import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter, FaSearch, FaUser, FaBars, FaBell, FaHistory, FaSignOutAlt } from 'react-icons/fa'; // 添加 FaSignOutAlt 图标
import logoImage from "../HomePageAssets/404.jpg";
import { auth, db } from "../../firebase";
import { doc, getDoc } from 'firebase/firestore';

const Homepage = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // track whether the user is logged in
  const [username, setUsername] = useState(""); // store the username
  const [greeting, setGreeting] = useState(""); // store the greeting message

  // 检查用户的登录状态
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setIsLoggedIn(true);
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUsername(userDoc.data().username || user.displayName || "User"); // 获取 Firestore 中的用户名
        }
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 获取当前时间并生成问候语
  useEffect(() => {
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
  }, []);

  // 用户点击登出时调用此函数
  const handleLogout = async () => {
    try {
      await auth.signOut(); // 调用 Firebase 的 signOut 方法
      window.location.reload(); // 刷新页面，清空状态
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
          <a href="/">Home</a>
          <a href="#">About</a>
          <a href="/contact">Support</a>
        </div>
        <div className="searchbar">
          <FaSearch />
          <input type="text" placeholder="Search" />
        </div>

        {/* if user login, show the greeting and logout button */}
        {isLoggedIn && (
          <div className="greeting">
            {greeting}, {username}!
            <FaSignOutAlt onClick={handleLogout} title="Logout" className="logout-icon" style={{ cursor: "pointer", marginLeft: "10px" }} />
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
                      <div className="notifcations">
                        <a href="#"><FaBell /> Notification</a>
                      </div>
                    </li>
                    <li>
                      <div className="historys">
                        <a href="#"><FaHistory /> History</a>
                      </div>
                    </li>
                    <li>
                      <div className="settings">
                        <Link to="/accountSettings"><FaUser /> Your Account</Link>
                      </div>
                    </li>
                  </>
                )}
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

      {/* Most Popular Entries Section */}
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

      {/* Recommendation Entries Section */}
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
