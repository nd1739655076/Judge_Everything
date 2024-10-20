import React, { useState, useEffect } from 'react';
import './ProductEntry.css';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
    FaExclamationTriangle,
    FaEdit
} from 'react-icons/fa';
import Slider from "react-slick";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

Modal.setAppElement('#root');

const ProductEntry = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
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
    const [productCreatorExists, setProductCreatorExists] = useState(true);

    const fetchProductData = async () => {
        try {
            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);
    
            if (productSnap.exists()) {
                const product = productSnap.data();
                setProductData(product);
                
                // Fetch parameters related to the product
                const paramsQuery = query(collection(db, 'Parameters'), where('productId', '==', productId));
                const paramsSnapshot = await getDocs(paramsQuery);
                const paramList = paramsSnapshot.docs.map(doc => ({ ...doc.data(), paramId: doc.id }));
                setParameters(paramList);
    
                // Fetch creator information if product exists
                if (product.creator) {
                    const userRef = doc(db, 'User', product.creator);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setProductCreatorExists(true);
                    } else {
                        setProductCreatorExists(false);
                    }
                }
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
    
            if (!userCommentTitle.trim()) {
                setErrorMessage('Cannot submit a comment without a title.');
                return;
            }
    
            if (!userComment.trim()) {
                setErrorMessage('Cannot submit an empty comment.');
                return;
            }
    
            if ((productData.commentList || []).filter(comment => comment.userId === loggedInUser.uid).length >= 3) {
                setErrorMessage('You have already provided three reviews for this entry. Please delete or edit your previous reviews before you start a new one.');
                return;
            }
    
            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);
    
            if (productSnap.exists()) {
                const productData = productSnap.data();
                const newTotalRaters = (productData.averageScore.totalRater || 0) + 1;
                const newTotalScore = (productData.averageScore.totalScore || 0) + userProductRating;
                const newAverageScore = newTotalScore / newTotalRaters;

                const currentDistribution = productData.ratingDistribution || {
                    'fiveStars': 0,
                    'fourStars': 0,
                    'threeStars': 0,
                    'twoStars': 0,
                    'oneStars': 0,
                };
                switch (userProductRating) {
                    case 5:
                        currentDistribution['fiveStars'] += 1;
                        break;
                    case 4:
                        currentDistribution['fourStars'] += 1;
                        break;
                    case 3:
                        currentDistribution['threeStars'] += 1;
                        break;
                    case 2:
                        currentDistribution['twoStars'] += 1;
                        break;
                    case 1:
                        currentDistribution['oneStars'] += 1;
                        break;
                    default:
                        console.error('Invalid rating input');
                }
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
    
                // Update ProductEntry with new comment and average score
                await updateDoc(productRef, {
                    averageScore: {
                        average: newAverageScore,
                        totalScore: newTotalScore,
                        totalRater: newTotalRaters,
                    },
                    ratingDistribution: currentDistribution,
                    commentList: arrayUnion(newComment)
                });
    
                // Update Parameters collection
                for (const [paramId, rating] of Object.entries(userRatings)) {
                    const paramRef = doc(db, 'Parameters', paramId);
                    const paramSnap = await getDoc(paramRef);
                    if (paramSnap.exists()) {
                        const paramData = paramSnap.data();
                        const newParamTotalRaters = (paramData.averageScore.totalRater || 0) + 1;
                        const newParamTotalScore = (paramData.averageScore.totalScore || 0) + rating;
                        const newParamAverage = newParamTotalScore / newParamTotalRaters;
    
                        await updateDoc(paramRef, {
                            averageScore: {
                                average: newParamAverage,
                                totalScore: newParamTotalScore,
                                totalRater: newParamTotalRaters,
                            }
                        });
                    }
                }
    
                // Fetch updated product and parameter data to ensure UI reflects latest changes
                await fetchProductData();
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
    
    const handleEditReview = () => {
        if (selectedReview && loggedInUser && selectedReview.userId === loggedInUser.uid) {
            setUserCommentTitle(selectedReview.title);
            setUserComment(selectedReview.content);
            setUserProductRating(selectedReview.rating);
            setUserRatings(selectedReview.parameterRatings);
            setModalIsOpen(false);
        }
    };

    const handleUpdateReview = async (e) => {
        e.preventDefault();
        try {
            setSuccessMessage('');
            setErrorMessage('');
    
            if (!loggedInUser) {
                setErrorMessage('You must be logged in to edit a comment.');
                return;
            }
    
            if (!userCommentTitle.trim()) {
                setErrorMessage('Cannot submit a comment without a title.');
                return;
            }
    
            if (!userComment.trim()) {
                setErrorMessage('Cannot submit an empty comment.');
                return;
            }
    
            if (userCommentTitle === selectedReview.title &&
                userComment === selectedReview.content &&
                userProductRating === selectedReview.rating &&
                JSON.stringify(userRatings) === JSON.stringify(selectedReview.parameterRatings)) {
                setErrorMessage('Cannot submit a new comment without changing.');
                return;
            }
    
            const productRef = doc(db, 'ProductEntry', productId);
            const updatedCommentList = productData.commentList.map((comment) => {
                if (comment.timestamp.seconds === selectedReview.timestamp.seconds && comment.content === selectedReview.content) {
                    return {
                        ...comment,
                        title: userCommentTitle,
                        content: userComment,
                        rating: userProductRating,
                        parameterRatings: userRatings,
                        timestamp: new Date(),
                    };
                }
                return comment;
            });
    
            await updateDoc(productRef, {
                commentList: updatedCommentList
            });
    
            // Update Parameters collection
            for (const [paramId, rating] of Object.entries(userRatings)) {
                const paramRef = doc(db, 'Parameters', paramId);
                const paramSnap = await getDoc(paramRef);
                if (paramSnap.exists()) {
                    const paramData = paramSnap.data();
                    const newParamTotalRaters = (paramData.averageScore.totalRater || 0) + 1;
                    const newParamTotalScore = (paramData.averageScore.totalScore || 0) + rating;
                    const newParamAverage = newParamTotalScore / newParamTotalRaters;
    
                    await updateDoc(paramRef, {
                        averageScore: {
                            average: newParamAverage,
                            totalScore: newParamTotalScore,
                            totalRater: newParamTotalRaters,
                        }
                    });
                }
            }
    
            // Fetch updated product and parameter data to ensure UI reflects latest changes
            await fetchProductData();
    
            setProductData((prevData) => ({
                ...prevData,
                commentList: updatedCommentList,
            }));
    
            setSuccessMessage('Your review has been updated!');
            setUserComment('');
            setUserCommentTitle('');
            setUserRatings({});
            setUserProductRating(0);
            setSelectedReview(null);
        } catch (error) {
            setErrorMessage('Failed to update your review. Please try again.');
            console.error('Error updating review:', error);
        }
    };
    
    

    const handleEditProduct = () => {
        if (loggedInUser && productData.creator === loggedInUser.uid) {
            navigate('../EditProduct', { state: { productId: productData.id, productData, parameters, editMode: true } });
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
        infinite: false,
        speed: 500,
        slidesToShow: 4,
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
                    <img 
                        src={productData.productImage || "https://via.placeholder.com/400"} 
                        alt={productData.productName || "Product"} 
                    />
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
                            {loggedInUser && productData.creator === loggedInUser.uid && (
                                <button className="edit-product-button" onClick={handleEditProduct}>
                                    <FaEdit /> Edit Product
                                </button>
                            )}
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
                            {productCreatorExists ? (
        <p>Creator: {productData.creator}</p>
    ) : (
        <p>Creator: Account no longer exists</p>
    )}
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
                                <p><strong>{review.title}</strong> by {review.username ? review.username : 'Anonymous Judger'}</p>
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
                        <div className="modal-header">
                            {loggedInUser && selectedReview.userId === loggedInUser.uid && (
                                <button className="edit-review-button" onClick={handleEditReview}><FaEdit /> Edit</button>
                            )}
                        </div>
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
                    <form className="review-form" onSubmit={selectedReview ? handleUpdateReview : handleSubmit}>
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