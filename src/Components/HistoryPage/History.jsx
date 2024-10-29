import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './History.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaCog} from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Firebase Firestore instance
import { LiaChessPawnSolid } from "react-icons/lia";

const History = () => {
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [greeting, setGreeting] = useState("");
    const [uid, setUid] = useState("");
    const [createProductRefs, setCreateProductRefs] = useState([]);
    const [createHistoryIndex, setCreateHistoryIndex] = useState(0);
    const [rateProductRefs, setRateProductRefs] = useState([]);
    const [rateHistoryIndex, setRateHistoryIndex] = useState(0);
    const [browseProductRefs, setBrowseProductRefs] = useState([]);
    const [browseHistoryIndex, setBrowseHistoryIndex] = useState(0);



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
                console.log("set logged in")
                setIsLoggedIn(true);
                setUsername(response.data.username);
                await setUid(response.data.uid);
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
        console.log("use effect is running");
        checkLoginStatus();
        setTimeGreeting();

        const intervalId = setInterval(() => {
            checkLoginStatus();
            setTimeGreeting();
          }, 5000);
        return () => clearInterval(intervalId);
    }, []);
    const fetchProducts = async () => {
        console.log("get history, uid:", uid);
        const userRef = doc(db, 'User', uid);
        console.log(userRef);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        console.log(userData);
        const productArray = userData.productProfileCreateHistory;
        const browseHistory = userData.browseHistory;
        console.log(productArray);
        if (productArray.length==0) {
            console.log("product array is empty");
        }
        const newRefs = Array(productArray.length).fill(null);
        for (let i=0; i<productArray.length; i++) {
            const productRef = doc(db, 'ProductEntry', productArray[i]);
            const productSnap = await getDoc(productRef);
            const productData = productSnap.data();
            newRefs[i] = productData;
            console.log(i, ": ", newRefs[i]);
        }
        const browseHistoryArray = Array(browseHistory.length).fill(null);
        for (let i=0; i<browseHistory.length; i++) {
            const productRef = doc(db, 'ProductEntry', browseHistory[i]);
            const productSnap = await getDoc(productRef);
            const productData = productSnap.data();
            browseHistoryArray[i] = productData;
            //console.log(i, ": ", newRefs[i]);
        }
        console.log(newRefs);
        await setCreateProductRefs(newRefs);
        await setBrowseProductRefs(browseHistoryArray);
        console.log(createProductRefs);
        console.log("create history:", createProductRefs);
        // setRateHistory(userData.rateCommentHistory);
        // setBrowseHistory(userData.browseHistory);
    };
    useEffect(() => {
        if (isLoggedIn) {
            fetchProducts();
        }
    }, [isLoggedIn]);
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
        {isLoggedIn && (
            <div className="currentUserStatus">
                <div className="greeting">
                {greeting} !
            </div>
            <div className="currentUserStatusInfo">
                <FaUser />
                <span className="username">{username}</span>
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
                        <Link to="/history"><FaHistory /> History</Link>
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
      {/* Product Entry Creation History */}
      <div className="product-history-container">
          <h1>Product Entry Creation History</h1>
          {/* List of Product Entry Cards */}
          <section className="product-history-content">
            <div className="product-cards">
              {createProductRefs.length > 0 ? (
               createProductRefs.slice(createHistoryIndex, createHistoryIndex+3).map((product, index) => (
                <div className="product-card" key={index}>
                  
                    {product ? (<div>
                        <div>
                        {product.productImage == null ? (
                            <div className="image-placeholder"></div>
                        ) : (
                            /* Placeholder if no image */
                            <div className="product-img"><img src={product.productImage} alt={product.productName} /></div>
                        )}
                        </div>
                        <div>
                          <h2>{product.productName}</h2>
                          <p>{product.description}</p>
                          <Link to={`/product/${product.id}`}>
                            <button>View</button>
                          </Link>
                        </div>
                    </div>) : (<p>Product is null</p>)}
                
                </div>
              ))) : (
                <p>No product entry creation history available.</p>
              )}
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
      {/* Product Browse History */}
      <div className="browse-history-container">
          <h1>Browse History</h1>
          {/* List of Product Entry Cards */}
          <section className="product-history-content">
            <div className="product-cards">
              {browseProductRefs.length > 0 ? (
               browseProductRefs.slice(browseHistoryIndex, browseHistoryIndex+3).map((product, index) => (
                <div className="product-card" key={index}>
                  
                    {product ? (<div>
                        <div>
                        {product.productImage == null ? (
                            <div className="image-placeholder"></div>
                        ) : (
                            /* Placeholder if no image */
                            <div className="product-img"><img src={product.productImage} alt={product.productName} /></div>
                        )}
                        </div>
                        <div>
                          <h2>{product.productName}</h2>
                          <p>{product.description}</p>
                          <Link to={`/product/${product.id}`}>
                            <button>View</button>
                          </Link>
                        </div>
                    </div>) : (<p>Product is null</p>)}
                
                </div>
              ))) : (
                <p>No product browse history available.</p>
              )}
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