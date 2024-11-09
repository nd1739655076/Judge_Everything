import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'; //change later
import './HomePage.css';
import { Link } from 'react-router-dom';
// icon import
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory, FaCog, FaSignOutAlt } from 'react-icons/fa';
// intro import
import Joyride from "react-joyride";
// chart import
import Modal from 'react-modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// image import
import logoImage from "../HomePageAssets/404.jpg";

Modal.setAppElement('#root');

const Homepage = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");

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
            setUserId(response.data.uid);
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
    const initializeTagLibrary = async () => {
      const handleTagLibraryRequest = httpsCallable(functions, 'handleTagLibraryRequest');
      const response = await handleTagLibraryRequest({ action: 'initializeTagLibrary' });
      if (response.data.success) {
        console.log('TagLibrary initialized successfully:', response.data.message);
      } else {
        console.error('Failed to initialize TagLibrary:', response.data.message);
      }
    };

    //initializeTagLibrary();
    checkLoginStatus();
    setTimeGreeting();
    fetchProducts();

    const intervalId = setInterval(() => {
      checkLoginStatus();
      setTimeGreeting();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  const handleLogout = async () => {
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      try {
        const response = await handleUserRequest({
          action: 'logout',
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          localStorage.removeItem('authToken');
          setIsLoggedIn(false);
          setUserId("");
          setUsername("");
          window.location.reload();
        }
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

  // intro
  const [run, setRun] = useState(false);
  const steps = [
    {
      target: ".step-1",
      content: "Use this menu bar to access your notifications, history, and accout settings"
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
    },
    {
      target: ".step-6",
      content: "You can always click here to revisit this tutorial."
    }
  ];
  useEffect(() => {
    const checkFirstLogin = async () => {
      if (isLoggedIn) {
        const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
        const firstLoginResponse = await handleUserRequest({
          action: 'checkFirstLogin',
          username: username,
        });
        if (firstLoginResponse.data.success) {
          setRun(true);
        }
      }
    }

    checkFirstLogin();
  }, [isLoggedIn]);
  const handleTourFinish = async () => {
    const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
    await handleUserRequest({
      action: 'setFirstLoginFalse',
      username: username
    });
  }
  // intro done

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const db = getFirestore();

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
  const handleViewRatingDistribution = async (productId) => {
    try {
      const productRef = doc(db, 'ProductEntry', productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        setSelectedProductData(productData);

        // Assuming the rating distribution is stored in the product document (as an example)
        const distribution = productData.ratingDistribution || {
          'fiveStars': 0,
          'fourStars': 0,
          'threeStars': 0,
          'twoStars': 0,
          'oneStars': 0,
        };

        // Convert distribution object into an array format for the graph
        const distributionArray = Object.entries(distribution).map(([rating, count]) => ({
          rating,
          count,
        }));

        setRatingDistribution(distributionArray); // Set the rating distribution data for the graph
        console.log('Rating distribution:', distributionArray);
        setModalIsOpen(true); // Open the modal
        console.log('Modal is open:', modalIsOpen);
      } else {
        console.log("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product rating distribution:", error);
    }
  };
  const closeModal = () => {
    setModalIsOpen(false);
  };

  // in cloud function later
  const handleRecordBrowsing = async (productId) => {
    if (isLoggedIn) {
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      try {
        const response = await handleUserRequest({
          action: 'recordBrowseHistory',
          productId: productId,
          uid: userId,
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
    <div className="homepage">

      {/* Intro */}
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
            handleTourFinish();
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
      />

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
          <a onClick={() => setRun(true)}
            className="step-6"
            style={{ cursor: 'pointer' }}
          >
            Tutorial
          </a>
        </div>
        <div className="searchbar">
          <FaSearch />
          <input type="text" placeholder="Search" />
        </div>
        {isLoggedIn ? (
          <div className="currentUserStatus">
            <div className="greeting">
              {greeting}!
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
        ) : (
          <div className="login-prompt">
            <p>Please log in to access more feature</p>
          </div>
        )}

        <div className="menuContainer">
          <FaBars className="menuicon step-1" onClick={toggleDropdown} />
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
                        <Link to="/history"><FaHistory /> History</Link>
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
          <Link to="/createProductEntry">
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
          <p>Will update every Thursday 11:59 p.m. EST</p>
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
          <Link to="/ProductListing">
            <button>LOAD MORE ENTRIES</button>
          </Link>
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
          {products.length > 0 ? (
            products.slice(0, 50).map(product => ( // Get the first 10 products
              <div key={product.id} className="recommendationEntryCard">
                <img src={product.productImage || "placeholder.jpg"} alt={product.productName} />
                <h1>
                  <Link to={`/product/${product.id}`} onClick={() => handleRecordBrowsing(product.id)}>
                    {product.productName}
                  </Link>
                </h1>
                <p style={{ whiteSpace: 'pre-line' }}>
                  Average Rating:{"\n"}
                  {product.averageScore?.average || "No ratings yet"}
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleViewRatingDistribution(product.id);
                  }}
                >
                  View
                </button>
              </div>
            ))
          ) : (
            <p>No products available</p>
          )}
        </div>
        <div className="recommendationLoadMore">
          <Link to="/ProductListing">
            <button>LOAD MORE ENTRIES</button>
          </Link>
        </div>
      </section>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Rating Distribution Modal"
        className="rating-distribution-modal"
        overlayClassName="rating-distribution-overlay"
      >
        <h2>Rating Distribution for {selectedProductData?.productName}</h2>
        <ResponsiveContainer width={500} height={300}>
          <BarChart
            data={ratingDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rating" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
        <button onClick={closeModal}>Close</button>
      </Modal>



    </div>
  );
};

export default Homepage;