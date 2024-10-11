import React, { useState, useEffect } from 'react';
import './ProductEntry.css';
import { Link, useParams } from 'react-router-dom';
import Modal from 'react-modal';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    FaPhone,
    FaEnvelope,
    FaInstagram,
    FaYoutube,
    FaTwitter,
    FaSearch,
    FaUser,
    FaBars,
    FaBell,
    FaHistory,
    FaCog,
    FaStar,
    FaLightbulb,
    FaShareAlt,
    FaThumbsUp,
    FaExclamationTriangle
} from 'react-icons/fa';
import Slider from "react-slick";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

Modal.setAppElement('#root');

const ProductEntry = () => {
    const { productId } = useParams();
    const [productData, setProductData] = useState(null);
    const [parameters, setParameters] = useState([]);
    const [userProductRating, setUserProductRating] = useState(0);
    const [userRatings, setUserRatings] = useState({});
    const [userComment, setUserComment] = useState('');
    const [userCommentTitle, setUserCommentTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [likedComments, setLikedComments] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const db = getFirestore();

    const fetchProductData = async () => {
        try {
            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                setProductData(productSnap.data());
                const paramsQuery = query(collection(db, 'Parameters'), where('productId', '==', productId));
                const paramsSnapshot = await getDocs(paramsQuery);
                const paramList = paramsSnapshot.docs.map(doc => ({ ...doc.data(), paramId: doc.id }));
                setParameters(paramList);
            } else {
                console.error("No product found for the given productId:", productId);
            }
        } catch (error) {
            console.error("Error fetching product data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductData();
        const fetchUserStatus = async () => {
            const userData = await getCurrentLoggedInUser();
            if (userData) {
                setLoggedInUser(userData);
            }
        };
        fetchUserStatus();
    }, [productId]);

    const getCurrentLoggedInUser = async () => {
        const localStatusToken = localStorage.getItem('authToken');
        if (localStatusToken) {
            const functions = getFunctions();
            const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
            try {
                const response = await handleUserRequest({
                    action: 'checkLoginStatus',
                    statusToken: localStatusToken
                });
                if (response.data.success) {
                    return {
                        uid: response.data.uid,
                        username: response.data.username
                    };
                } else {
                    return null;
                }
            } catch (error) {
                console.error("Error checking login status:", error);
                return null;
            }
        } else {
            return null;
        }
    };

    const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

    const handleProductRatingChange = (rating) => {
        setUserProductRating(rating);
    };

    const handleRatingChange = (paramId, rating) => {
        setUserRatings((prevRatings) => ({
            ...prevRatings,
            [paramId]: rating,
        }));
    };

    const handleCommentChange = (e) => {
        setUserComment(e.target.value);
    };

    const handleCommentTitleChange = (e) => {
        setUserCommentTitle(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSuccessMessage('');
            setErrorMessage('');

            if (!loggedInUser) {
                setErrorMessage('You must be logged in to submit a comment.');
                return;
            }

            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const productData = productSnap.data();
                const newTotalRaters = (productData.averageScore.totalRater || 0) + 1;
                const newTotalScore = (productData.averageScore.totalScore || 0) + userProductRating;
                const newAverageScore = newTotalScore / newTotalRaters;

                const newComment = {
                    title: userCommentTitle,
                    content: userComment,
                    rating: userProductRating,
                    parameterRatings: userRatings,
                    timestamp: new Date(),
                    likes: 0,
                    userId: loggedInUser.uid,
                    username: loggedInUser.username
                };

                await updateDoc(productRef, {
                    averageScore: {
                        average: newAverageScore,
                        totalScore: newTotalScore,
                        totalRater: newTotalRaters,
                    },
                    commentList: arrayUnion(newComment)
                });

                setProductData((prevData) => ({
                    ...prevData,
                    averageScore: {
                        average: newAverageScore,
                        totalScore: newTotalScore,
                        totalRater: newTotalRaters,
                    },
                    commentList: [...(prevData.commentList || []), newComment],
                }));

                setSuccessMessage('Your ratings and comment have been submitted!');
                setUserComment('');
                setUserCommentTitle('');
                setUserRatings({});
                setUserProductRating(0);
            } else {
                console.error("Product not found for the given productId:", productId);
            }
        } catch (error) {
            setErrorMessage('Failed to submit your ratings and comment. Please try again.');
            console.error('Error submitting ratings and comment:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!productData) {
        return <div>Product not found</div>;
    }

    const openModal = (review) => {
        setSelectedReview(review);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
    };

    const handleFavoriteClick = () => {
        setIsFavorite(!isFavorite);
    };

    const handleLikeClick = async (review) => {
        const productRef = doc(db, 'ProductEntry', productId);
        const updatedCommentList = productData.commentList.map((comment) => {
            if (comment.timestamp.seconds === review.timestamp.seconds && comment.content === review.content) {
                return { ...comment, likes: comment.likes + 1 };
            }
            return comment;
        });
        await updateDoc(productRef, {
            commentList: updatedCommentList
        });
        setProductData((prevData) => ({
            ...prevData,
            commentList: updatedCommentList,
        }));
        setLikedComments((prevLikedComments) => [...prevLikedComments, review]);
    };

    const sliderSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 1,
    };

    return (
        <div className="product-entry-page">
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

                <div className="menuContainer">
                    <FaBars className="menuicon" onClick={toggleDropdown} />
                    {isDropdownVisible && (
                        <div className="dropdownMenu">
                            <ul>
                                {!loggedInUser ? (
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

            <div className="product-entry-container">
                <div className="product-info">
                    <div className="product-image">
                        <img src="https://via.placeholder.com/400" alt="Product" />
                    </div>
                    <div className="product-details">
                        <h1>{productData.productName}
                            <FaStar
                                className={`favorite-icon ${isFavorite ? 'favorite-active' : ''}`}
                                onClick={handleFavoriteClick}
                            />
                            <button className="report-button">
                                <FaExclamationTriangle /> Report
                            </button>
                        </h1>
                        <p className="average-rating">Average: {productData.averageScore.average.toFixed(1)} / 5.0</p>
                        <div className="rating-categories">
                            <ul>
                                {parameters.map((param, index) => (
                                    <li key={index}>
                                        <span>{param.paramName}: ({param.averageScore.average.toFixed(1)}/5)</span>
                                        {[...Array(5)].map((_, starIndex) => (
                                            <FaStar key={starIndex} className={starIndex < Math.round(param.averageScore.average) ? 'filled-star' : ''} />
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="creator-info">
                            <p>Creator: {productData.creator}</p>
                            <button className="share-button"><FaShareAlt /> Share</button>
                        </div>
                    </div>
                </div>

                <div className="reviews-section">
                    <h2>Reviews About This Product</h2>
                    <Slider {...sliderSettings}>
                        {(productData.commentList || []).map((review, index) => (
                            <div key={index} className="review-card" onClick={() => openModal(review)}>
                                <div className="review-stars">
                                    {[...Array(5)].map((_, starIndex) => (
                                        <FaStar key={starIndex} className={starIndex < review.rating ? 'filled-star' : ''} />
                                    ))}
                                </div>
                                <p><strong>{review.title}</strong> by {review.username}</p>
                                <p>{review.content.substring(0, 40)}...</p>
                                <p>Posted on: {review.timestamp && review.timestamp.seconds ? new Date(review.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</p>
                                <div className="review-footer">
                                    <div className="review-likes" onClick={() => handleLikeClick(review)}>
                                        <FaThumbsUp className={`thumbs-up-icon ${likedComments.includes(review) ? 'liked' : ''}`} /> {review.likes}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>

                {selectedReview && (
                    <Modal
                        isOpen={modalIsOpen}
                        onRequestClose={closeModal}
                        className="review-modal"
                        overlayClassName="review-modal-overlay"
                    >
                        <h2>{selectedReview.title}</h2>
                        <p><strong>Posted:</strong> {new Date(new Date(selectedReview.timestamp.seconds * 1000)).toLocaleString()}</p>
                        <div className="modal-stars">
                            <span>Overall Rating: </span>
                            {[...Array(5)].map((_, index) => (
                                <FaStar key={index} className={index < selectedReview.rating ? 'filled-star' : ''} />
                            ))}
                        </div>
                        <div className="rating-categories">
                            <h3>Parameter Ratings:</h3>
                            {Object.entries(selectedReview.parameterRatings).map(([paramId, rating], index) => (
                                <div key={index} className="rating-item">
                                    <span>{parameters.find(param => param.paramId === paramId)?.paramName || 'Parameter'}: </span>
                                    {[...Array(5)].map((_, starIndex) => (
                                        <FaStar key={starIndex} className={starIndex < rating ? 'filled-star' : ''} />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <p className="review-content">{selectedReview.content}</p>
                        <button className="close-modal-button" onClick={closeModal}>Close</button>
                    </Modal>
                )}

                <div className="write-review-section">
                    <h2 className="review-heading">Judge It Yourself!</h2>
                    <form className="review-form" onSubmit={handleSubmit}>
                        <div className="review-title">
                            <input type="text" value={userCommentTitle} onChange={handleCommentTitleChange} placeholder="Type Your Title Here" />
                            <div className="title-stars">
                                {[...Array(5)].map((_, index) => (
                                    <FaStar
                                        key={index}
                                        className={index < userProductRating ? 'filled-star' : ''}
                                        onClick={() => handleProductRatingChange(index + 1)}
                                    />
                                ))}
                            </div>
                        </div>
                        <textarea
                            value={userComment}
                            onChange={handleCommentChange}
                            placeholder="Write your comment here..."
                        ></textarea>
                        <div className="rating-section">
                            {parameters.map((param, index) => (
                                <div key={index} className="rating-item">
                                    <FaLightbulb />
                                    <span>{param.paramName}</span>
                                    {[...Array(5)].map((_, starIndex) => (
                                        <FaStar
                                            key={starIndex}
                                            className={userRatings[param.paramId] >= starIndex + 1 ? 'filled-star' : ''}
                                            onClick={() => handleRatingChange(param.paramId, starIndex + 1)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <button type="submit" className="submit-button">Submit</button>
                    </form>
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default ProductEntry;