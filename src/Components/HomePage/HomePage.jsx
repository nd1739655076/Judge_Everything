import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'; //change later
import './HomePage.css';
import { Link } from 'react-router-dom';
// icon import
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaComments, FaHistory, FaCog, FaSignOutAlt } from 'react-icons/fa';
// intro import
import Joyride from "react-joyride";
// chart import
import Modal from 'react-modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// image import
import logoImage from "../HomePageAssets/logo1.png";

Modal.setAppElement('#root');

const Homepage = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [userTagScore, setUserTagScore] = useState("");
  const [userSubtagScore, setUserSubtagScore] = useState("");
  const [userIfNewNotification, setUserIfNewNotification] = useState("");
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
            setUserTagScore(response.data.tagScores);
            setUserSubtagScore(response.data.subtagScore);
            setUserIfNewNotification(response.data.ifNewNotification);
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
    const updatesUserTagScores = async () => {
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      const response = await handleUserRequest({ action: 'updateTags', uidNum: userId });
      if (response.data.success) {
        console.log('TagScore updated successfully:', response.data.message);
      } else {
        console.error('Failed to initialize TagLibrary:', response.data.message);
      }
    };
    //initializeTagLibrary();
    checkLoginStatus();
    setTimeGreeting();
    //updatesUserTagScores();
    //fetchProducts();

    const intervalId = setInterval(() => {
      checkLoginStatus();
      setTimeGreeting();
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  useEffect(() => {
    const updatesUserTagScores = async () => {
      if (userId) {
        const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
        try {
          const response = await handleUserRequest({ action: 'updateTags', uidNum: userId });
          if (response.data.success) {
            console.log('TagScore updated successfully:', response.data.message);
          } else {
            console.error('Failed to update TagScores:', response.data.message);
          }
        } catch (error) {
          console.error('Error updating TagScores:', error);
        }
      }
    };

    if (isLoggedIn) {
      updatesUserTagScores();
    }
  }, [isLoggedIn, userId, functions]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (isLoggedIn) {
        try {
          const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
          const response = await handleProductEntryRequest({ action: 'fetchProducts' });

          if (response.data.success) {
            const scoredProducts = response.data.data.map((product, index) => {
              console.log(`Processing product at index ${index}:`, product); // Log each product before processing
              let score = 0;

              // Process tag scores
              if (product.tagList) {
                console.log(`Product "${product.productName}" has tags:`, product.tagList);
                const tags = Array.isArray(product.tagList) ? product.tagList : [product.tagList];
                console.log(`Tags array for product "${product.productName}":`, tags);
                tags.forEach((tag, tagIndex) => {
                  const tagScore = userTagScore[tag] || 0; // Get tag score or default to 0
                  score += tagScore;
                  console.log(
                    `Product "${product.productName}": Processing tag at index ${tagIndex} - Tag: ${tag}, Tag Score: ${tagScore}, Current Score: ${score}`
                  );
                });
              } else {
                console.log(`Product "${product.productName}" has no tags.`); // Log if there are no tags
              }

              // Process subtag scores
              if (product.subtagList && Array.isArray(product.subtagList)) {
                console.log(`Product "${product.productName}" has subtags:`, product.subtagList);
                product.subtagList.forEach((subtag, subtagIndex) => {
                  const subtagScore = userTagScore[subtag] || 0; // Get subtag score or default to 0
                  score += subtagScore;
                  console.log(
                    `Product "${product.productName}": Processing subtag at index ${subtagIndex} - Subtag: ${subtag}, Subtag Score: ${subtagScore}, Current Score: ${score}`
                  );
                });
              } else {
                console.log(`Product "${product.productName}" has no subtags.`); // Log if there are no subtags
              }

              console.log(`Final score for product "${product.productName}": ${score}`);
              return { ...product, score };
            });

            // Sort products by score in descending order
            scoredProducts.sort((a, b) => b.score - a.score);
            setProducts(scoredProducts);
          } else {
            console.error("Failed to fetch product list:", response.data.message);
          }
        } catch (error) {
          console.error("Error fetching product list:", error);
        } finally {
          setLoading(false);
        }
      }
    };


    fetchProducts();
  }, [isLoggedIn, userTagScore, functions]);

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
      const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
      const response = await handleProductEntryRequest({ action: 'fetchProducts' });

      if (response.data.success) {
        const scoredProducts = response.data.data.map((product) => {
          let score = 0;
          if (product.tagList) {
            product.tagList.forEach((tag) => {
              if (userTagScore[tag]) {
                score += userTagScore[tag];
              }
            });
          }
          return { ...product, score };
        });

        scoredProducts.sort((a, b) => b.score - a.score);
        setProducts(response.data.data);
      } else {
        console.error("Failed to fetch product list:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching product list:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleViewRatingDistribution = async (productId) => {
    try {
      const productRef = doc(db, 'ProductEntry', productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        setSelectedProductData(productData);

        // Assuming the rating distribution is stored in the product document
        const distribution = productData.ratingDistribution || {
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          twoStars: 0,
          oneStars: 0,
        };

        // Enforce static order for ratings
        const ratingOrder = [
          { rating: '5 Stars', key: 'fiveStars' },
          { rating: '4 Stars', key: 'fourStars' },
          { rating: '3 Stars', key: 'threeStars' },
          { rating: '2 Stars', key: 'twoStars' },
          { rating: '1 Star', key: 'oneStars' },
        ];

        // Map the static order into an array
        const distributionArray = ratingOrder.map(({ rating, key }) => ({
          rating,
          count: distribution[key] || 0, // Default to 0 if key is missing
        }));

        setRatingDistribution(distributionArray); // Set the rating distribution data for the graph
        //log('Rating distribution (ordered):', distributionArray);
        //console.log('Raw distribution data:', distribution);
        //console.log('Ordered Rating Distribution:', distributionArray);
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

        <div className={`menuContainer ${userIfNewNotification ? "has-notifications" : ""}`}>
        
        
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
                      <div className={`Notifications ${userIfNewNotification ? "has-notifications" : ""}`}>
                        <Link to={`/notification/${userId}`}>
                          <FaBell /> Notifications
                        </Link>
                      </div>
                    </li>
                    <li>
                      <div className="message">
                        <Link to="/message"><FaComments /> Message</Link>
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
          {products
            .slice()
            .sort((a, b) => b.averageScore.totalRater - a.averageScore.totalRater)
            .slice(0, 5) // Show top 5 most popular products
            .map((product, index) => (
              <div key={product.id} className="mostPopularEntryCard">
                <img
                  src={product.productImage || "placeholder.jpg"}
                  alt={product.productName || "Product Image"}
                />
                <h1>{product.productName || "Unknown Product"}</h1>
                <p>Total Ratings: {product.averageScore.totalRater || 0}</p>
                <Link to={`/product/${product.id}`}>View</Link>
              </div>
            ))}
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
        {isLoggedIn ? (
          <div className="recommendationEntriesGrid">
            {products.length > 0 ? (
              products.slice(0, 10).map(product => ( // Get the first 10 products
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
        ) : (
          <p>Please login to see recommendations</p>
        )}
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
          <BarChart data={ratingDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rating" /> {/* Use the 'rating' property for X-axis labels */}
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8084d8" />
          </BarChart>
        </ResponsiveContainer>
        <button onClick={closeModal}>Close</button>
      </Modal>




    </div>
  );
};

export default Homepage;