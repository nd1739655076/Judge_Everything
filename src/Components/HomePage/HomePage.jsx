import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './HomePage.css';
import { getFirestore, collection, getDocs } from 'firebase/firestore'; 
import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory , FaCog, FaSignOutAlt} from 'react-icons/fa';
import logoImage from "../HomePageAssets/404.jpg";

const Homepage = () => {

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [products, setProducts] = useState([]); // To store the list of products
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productEntriesRef = collection(db, 'ProductEntry');
        const productSnapshot = await getDocs(productEntriesRef);
        const productList = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productList); // Update the product list state
      } catch (error) {
        console.error("Error fetching product list:", error);
      } finally {
        setLoading(false); // Stop loading once the data is fetched
      }
    };

    fetchProducts();
  }, [db]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const localStatusToken = localStorage.getItem('authToken');
      if (localStatusToken) {
        const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
        try {
          console.log("Checking login status with token:", localStatusToken);
          const response = await handleUserRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
          console.log("Response from checkLoginStatus:", response.data);
          if (response.data.status === 'success') {
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
    checkLoginStatus();
  }, []);
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
  const handleLogout = async () => {
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      try {
        const response = await handleUserRequest({
          action: 'logout',
          statusToken: localStatusToken,
        });
        if (response.data.status === 'success') {
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setUsername("");
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
          <div className="product-list">
            {products.length > 0 ? (
              products.map(product => (
                <div key={product.id} className="product-item">
                  <Link to={`/product/${product.id}`}>
                    <h3>{product.productName}</h3>
                    <p>Average Rating: {product.averageScore?.average || "No ratings yet"}</p>
                  </Link>
                </div>
              ))
            ) : (
              <p>No products available</p>
            )}
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