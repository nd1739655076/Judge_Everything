import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './History.css';

import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter, FaStar, FaThumbsUp } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaCog} from 'react-icons/fa';
import { doc, getDoc, updateDoc  } from 'firebase/firestore';
import { db } from '../../firebase'; // Firebase Firestore instance

const ReviewHistory = () => {
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [greeting, setGreeting] = useState("");
    const [uid, setUid] = useState("");
    const [rateProductRefs, setRateProductRefs] = useState([]);
    const [rateHistoryPage, setRateHistoryPage] = useState(1);
    const [totalRatePages, setTotalRatePages] = useState(0);
    const [loading, setLoading] = useState(true);



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
                setLoading(false);
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
        setLoading(true);
        console.log("get history, uid:", uid);
        const userRef = doc(db, 'User', uid);
        console.log(userRef);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        console.log(userData);
        // const createProductHistory = userData.productProfileCreateHistory || [];
        // const browseHistory = userData.browseHistory || [];
        const rateHistory = userData.rateCommentHistory || [];
        // console.log(createProductHistory);
        // if (createProductHistory.length==0) {
        //     console.log("product array is empty");
        // }
        // const createProductHistoryArray = Array(createProductHistory.length).fill(null);
        // for (let i=0; i<createProductHistory.length; i++) {
        //     const productRef = doc(db, 'ProductEntry', createProductHistory[i]);
        //     const productSnap = await getDoc(productRef);
        //     const productData = productSnap.data();
        //     createProductHistoryArray[i] = productData;
        // }
        // setTotalCreatePages(Math.ceil(createProductHistory.length / 3));
        // const browseHistoryArray = Array(browseHistory.length).fill(null);
        // for (let i=0; i<browseHistory.length; i++) {
        //     const productRef = doc(db, 'ProductEntry', browseHistory[i]);
        //     const productSnap = await getDoc(productRef);
        //     const productData = productSnap.data();
        //     browseHistoryArray[i] = productData;
        // }
        // setTotalBrowsePages(Math.ceil(browseHistory.length / 3));

        const rateHistoryArray = Array(rateHistory.length).fill(null);
        for (let i=0; i<rateHistory.length; i++) {
            const rateRef = doc(db, 'Comments', rateHistory[i]);
            const rateSnap = await getDoc(rateRef);
            const rateData = rateSnap.data();
            rateHistoryArray[i] = rateData;
            console.log("rateHistoryArray[i]:",rateHistoryArray[i]);
        }
        setTotalRatePages(Math.ceil(rateHistory.length / 3));
        // await setCreateProductRefs(createProductHistoryArray);
        // await setBrowseProductRefs(browseHistoryArray);
        await setRateProductRefs(rateHistoryArray);
        // console.log("rateProductRefs:",rateProductRefs);
        setLoading(false);
    };
    useEffect(() => {
        if (isLoggedIn) {
            fetchProducts();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn]);
    const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
    };
    const handleRecordBrowsing = async (productId) => {
        if (isLoggedIn) {
          const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
          try {
            const response = await handleUserRequest({
              action: 'recordBrowseHistory',
              productId: productId,
              uid: uid,
            });
            if (response.data.success) {
              console.log("Recorded browsing history for ", productId);
            } else {
              console.error(`Browse history recording failed: ${response.data.message}`);
            }
          } catch (error) {
            console.error("Error recording browse history: ", error);
          }
        }   
    }
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
      {/* Reviews (Comment/Rate) History */}
      <div className="review-history-container">
          <section>
            <h1>Comment/Rating History</h1>
            <div className="review-cards">
              {rateProductRefs.length > 0 ? (
                rateProductRefs.slice((rateHistoryPage-1)*3, ((rateHistoryPage-1)*3)+3).map((review, index) => (
                <div className="review-history-card" key={index}>
                  <div className="review-content">
                    <div>
                        <p>
                            {[...Array(5)].map((_, starIndex) => (
                            <FaStar key={starIndex} className={starIndex < Math.round(review.averageRating) ? 'filled-star' : ''} />
                            ))}
                        </p>
                        <h3><strong>{review.title}</strong> by {review.user.username ? review.user.username : 'Anonymous Judger'}</h3>
                        <p>{review.content}</p>
                        <p>Posted on: {review.timestamp && review.timestamp.seconds ? 
                        new Date(review.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</p>
                        <div className="review-footer">
                            <div className="review-likes">
                                <FaThumbsUp color={review.likes.includes(review.user.uid) ? "black" : "#ccc"} />
                                {review.likeAmount}
                            </div>
                            <Link to={`/product/${review.productId}`} onClick={() => handleRecordBrowsing(review.productId)}>
                                <button>View</button>
                            </Link>
                        </div>
                    </div>
                  </div>
                </div>
              ))) : (
                <p>{loading ? ("Loading...") : ("No review history available.")}</p>
              )}
            </div>
            {/* Pagination */}
            <div className="paging">
                <button disabled={rateHistoryPage === 1} onClick={() => setRateHistoryPage(rateHistoryPage - 1)}>
                    &larr; Prev</button>
                {/* Display all pages directly if there are less than 5 total pages */}
                {totalRatePages < 5 ? (
                    [...Array(totalRatePages)].map((_, index) => (
                    <span
                        key={index + 1}
                        className={(rateHistoryPage === index + 1) ? "active" : ""}
                        onClick={() => setRateHistoryPage(index + 1)}>
                        {index + 1}
                    </span>
                    ))
                ) : (
                    <>
                    {rateHistoryPage > 1 && <span onClick={() => setRateHistoryPage(1)}>1</span>}
                    {rateHistoryPage > 3 && <span>...</span>}

                    {/* Show current page and surrounding pages */}
                    {rateHistoryPage > 1 && (
                        <span onClick={() => setRateHistoryPage(rateHistoryPage - 1)}>
                        {rateHistoryPage - 1}
                        </span>
                    )}
                    <span className="active" onClick={() => setRateHistoryPage(rateHistoryPage)}>
                        {rateHistoryPage}
                        </span>
                    {rateHistoryPage < totalRatePages && (
                        <span onClick={() => setRateHistoryPage(rateHistoryPage + 1)}>
                        {rateHistoryPage + 1}
                        </span>
                    )}

                    {(rateHistoryPage < (totalRatePages - 2)) && <span>...</span>}
                    {rateHistoryPage < totalRatePages && (
                        <span onClick={() => setRateHistoryPage(totalRatePages)}>{totalRatePages}</span>
                    )}
                    </>
                )}
                <button disabled={rateHistoryPage === totalRatePages} onClick={() => setRateHistoryPage(rateHistoryPage + 1)}>
                    Next &rarr;</button>
            </div>
          </section>
          <Link to="/history"><button className="history-button" style={{ padding: '7px 15px' }}>Back</button></Link>
      </div>
    </div>
  );
};

export default ReviewHistory;