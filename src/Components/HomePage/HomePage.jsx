import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaHistory , FaCog, FaSignOutAlt} from 'react-icons/fa';
import logoImage from "../HomePageAssets/404.jpg";
import Modal from 'react-modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './HomePage.css';

Modal.setAppElement('#root');

const Homepage = () => {

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [products, setProducts] = useState([]); // To store the list of products
  const [loading, setLoading] = useState(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [ratingDistribution, setRatingDistribution] = useState([]); 
  const db = getFirestore();

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  useEffect(() => {
    console.log('Modal is open state changed:', modalIsOpen);
  }, [modalIsOpen]);
  
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

  const closeModal = () => {
    setModalIsOpen(false);
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
                  </Link>
                  <p onClick={() => handleViewRatingDistribution(product.id)} style={{ cursor: 'pointer' }}>
                    Average Rating: {product.averageScore?.average || "No ratings yet"}
                  </p>
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

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Rating Distribution Modal"
        className="rating-distribution-modal"
        overlayClassName="rating-distribution-overlay"
      >
        <h2>Rating Distribution for {selectedProductData?.productName}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
      { rating: '5 Stars', count: 10 },
      { rating: '4 Stars', count: 5 },
      { rating: '3 Stars', count: 3 },
      { rating: '2 Stars', count: 2 },
      { rating: '1 Star', count: 1 },
    ]}
  >
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