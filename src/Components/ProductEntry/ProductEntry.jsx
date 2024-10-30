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
    FaThumbsDown,
    FaExclamationTriangle,
    FaEdit
} from 'react-icons/fa';
import Slider from "react-slick";
import { getFirestore, doc, getDoc, arrayRemove, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

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
    const [dislikedComments, setDislikedComments] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const db = getFirestore();
    const [productCreatorExists, setProductCreatorExists] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [expandedComments, setExpandedComments] = useState({}); 

    const fetchProductData = async () => {
        try {
            if (!productId) {
                throw new Error("Invalid productId");
            }
    
            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);
    
            if (productSnap.exists()) {
                const product = productSnap.data();
                const commentIds = product.commentList || [];
    
                // 检查每个 commentId 是否是有效字符串
                const commentPromises = commentIds.map(async (commentId) => {
                    if (typeof commentId !== 'string' || commentId.trim() === '') {
                        console.warn(`Invalid commentId found: ${commentId}`);
                        return null;
                    }
                    const commentRef = doc(db, 'Comments', commentId);
                    const commentSnap = await getDoc(commentRef);
    
                    if (commentSnap.exists()) {
                        const commentData = commentSnap.data();
                        if (loggedInUser) {
                            if (commentData.likes && commentData.likes.includes(loggedInUser.uid)) {
                                setLikedComments((prev) => [...prev, commentId]);
                            }
                            if (commentData.dislikes && commentData.dislikes.includes(loggedInUser.uid)) {
                                setDislikedComments((prev) => [...prev, commentId]);
                            }
                        }
                        return { ...commentData, commentId };
                    } else {
                        return null;
                    }
                });
    
                const comments = (await Promise.all(commentPromises)).filter(Boolean);
    
                const paramRefs = product.parametorList || [];
                const paramPromises = paramRefs.map(async (paramId) => {
                    const paramRef = doc(db, 'Parameters', paramId);
                    const paramSnap = await getDoc(paramRef);
                    return paramSnap.exists() ? { paramId, ...paramSnap.data() } : null;
                });
                const parametersData = (await Promise.all(paramPromises)).filter(Boolean);
    
                setProductData({ ...product, comments });
                setParameters(parametersData);
            } else {
                console.error("Product not found for the given productId:", productId);
            }
        } catch (error) {
            console.error("Error fetching product data:", error);
        } finally {
            setLoading(false);
        }
    };
    

    const fetchTopReplies = async (commentId) => {
        const functions = getFunctions();
        const handleCommentRequest = httpsCallable(functions, 'handleCommentRequest');

        try {
            const response = await handleCommentRequest({
                action: 'getTopReplies',
                commentId,
                productId,
                limit: 3  // 限制为点赞数最高的三条
            });

            return response.data.replies || [];
        } catch (error) {
            console.error("Error fetching top replies:", error);
            return [];
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

    const handleLikeDislike = async (review, isLike) => {
        if (!loggedInUser) {
            setErrorMessage('You must be logged in to like or dislike a comment.');
            return;
        }

        const functions = getFunctions();
        const handleCommentRequest = httpsCallable(functions, 'handleCommentRequest');

        try {
            const response = await handleCommentRequest({
                action: 'likeDislike',
                commentId: review.commentId,
                uid: loggedInUser.uid,
                isLike
            });

            if (response.data.success) {
                const commentRef = doc(db, 'Comments', review.commentId);
                if (isLike) {
                    await updateDoc(commentRef, {
                        likedBy: arrayUnion(loggedInUser.uid),
                        dislikedBy: arrayRemove(loggedInUser.uid)
                    });
                } else {
                    await updateDoc(commentRef, {
                        dislikedBy: arrayUnion(loggedInUser.uid),
                        likedBy: arrayRemove(loggedInUser.uid)
                    });
                }

                // 更新本地 liked 和 disliked 状态
                let updatedReview = { ...review };

                if (isLike) {
                    setLikedComments((prev) =>
                        prev.includes(review.commentId)
                            ? prev.filter((id) => id !== review.commentId)
                            : [...prev, review.commentId]
                    );
                    setDislikedComments((prev) => prev.filter((id) => id !== review.commentId));
                    updatedReview.likeAmount = likedComments.includes(review.commentId)
                        ? updatedReview.likeAmount - 1
                        : updatedReview.likeAmount + 1;
                } else {
                    setDislikedComments((prev) =>
                        prev.includes(review.commentId)
                            ? prev.filter((id) => id !== review.commentId)
                            : [...prev, review.commentId]
                    );
                    setLikedComments((prev) => prev.filter((id) => id !== review.commentId));
                    updatedReview.dislikeAmount = dislikedComments.includes(review.commentId)
                        ? updatedReview.dislikeAmount - 1
                        : updatedReview.dislikeAmount + 1;
                }

                setSelectedReview(updatedReview);
                await fetchProductData();
                setSuccessMessage('Updated like/dislike successfully.');
            } else {
                setErrorMessage('Failed to update like/dislike.');
            }
        } catch (error) {
            console.error('Error updating like/dislike:', error);
            setErrorMessage('An error occurred while updating like/dislike.');
        }
    };

    const handleAddReply = async (commentId) => {
        if (!loggedInUser) {
            setErrorMessage('You must be logged in to reply.');
            return;
        }

        const functions = getFunctions();
        const handleCommentRequest = httpsCallable(functions, 'handleCommentRequest');

        try {
            const response = await handleCommentRequest({
                action: 'addReply',
                content: replyContent,
                user: { uid: loggedInUser.uid, username: loggedInUser.username },
                productId,
                parentCommentId: commentId
            });

            if (response.data.success) {
                setReplyContent('');
                await fetchProductData(); // 刷新数据以显示新回复
                setSuccessMessage('Reply added successfully.');
            } else {
                setErrorMessage('Failed to add reply.');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            setErrorMessage('An error occurred while adding reply.');
        }
    };

    const toggleExpandReplies = (commentId) => {
        setExpandedComments((prev) => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
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
                console.log("User not logged in.");
                return;
            }
    
            if (!userCommentTitle.trim()) {
                setErrorMessage('Cannot submit a comment without a title.');
                console.log("Comment title is empty.");
                return;
            }
    
            if (!userComment.trim()) {
                setErrorMessage('Cannot submit an empty comment.');
                console.log("Comment content is empty.");
                return;
            }
    
            const userCommentCount = (productData.comments || []).filter(comment => comment.userId === loggedInUser.uid).length;
            if (userCommentCount >= 3) {
                setErrorMessage('You have already provided three reviews for this entry. Please delete or edit your previous reviews before you start a new one.');
                console.log(`User has ${userCommentCount} reviews; cannot add more.`);
                return;
            }
    
            const functions = getFunctions();
            const handleCommentRequest = httpsCallable(functions, 'handleCommentRequest');
            
            // 调用云函数生成新评论并打印传递的数据
            const requestData = {
                action: 'generate',
                title: userCommentTitle,
                content: userComment,
                averageRating: userProductRating,
                parameterRatings: userRatings,
                user: { uid: loggedInUser.uid, username: loggedInUser.username },
                productId
            };
            console.log("Sending request to handleCommentRequest with data:", requestData);
    
            const response = await handleCommentRequest(requestData);
            console.log("Response from handleCommentRequest:", response.data);
    
            if (response.data.success) {
                console.log("Comment created successfully:", response.data.message);
    
                // 获取 ProductEntry 文档
                const productRef = doc(db, 'ProductEntry', productId);
                const productSnap = await getDoc(productRef);
    
                if (productSnap.exists()) {
                    const productData = productSnap.data();
                    const newTotalRaters = (productData.averageScore.totalRater || 0) + 1;
                    const newTotalScore = (productData.averageScore.totalScore || 0) + userProductRating;
                    const newAverageScore = newTotalScore / newTotalRaters;
    
                    const currentDistribution = productData.ratingDistribution || {
                        fiveStars: 0,
                        fourStars: 0,
                        threeStars: 0,
                        twoStars: 0,
                        oneStars: 0,
                    };
    
                    console.log("Updating rating distribution based on user rating:", userProductRating);
                    switch (userProductRating) {
                        case 5: currentDistribution.fiveStars += 1; break;
                        case 4: currentDistribution.fourStars += 1; break;
                        case 3: currentDistribution.threeStars += 1; break;
                        case 2: currentDistribution.twoStars += 1; break;
                        case 1: currentDistribution.oneStars += 1; break;
                        default: console.error('Invalid rating input');
                    }
    
                    console.log("New average score:", newAverageScore);
                    await updateDoc(productRef, {
                        averageScore: {
                            average: newAverageScore,
                            totalScore: newTotalScore,
                            totalRater: newTotalRaters,
                        },
                        ratingDistribution: currentDistribution,
                    });
    
                    for (const [paramId, rating] of Object.entries(userRatings)) {
                        const paramRef = doc(db, 'Parameters', paramId);
                        const paramSnap = await getDoc(paramRef);
                        if (paramSnap.exists()) {
                            const paramData = paramSnap.data();
                            const newParamTotalRaters = (paramData.averageScore.totalRater || 0) + 1;
                            const newParamTotalScore = (paramData.averageScore.totalScore || 0) + rating;
                            const newParamAverage = newParamTotalScore / newParamTotalRaters;
    
                            console.log(`Updating parameter ${paramId} with new average:`, newParamAverage);
                            await updateDoc(paramRef, {
                                averageScore: {
                                    average: newParamAverage,
                                    totalScore: newParamTotalScore,
                                    totalRater: newParamTotalRaters,
                                }
                            });
                        }
                    }
    
                    // 刷新数据并重置表单
                    console.log("Refreshing product data after comment submission.");
                    await fetchProductData();
                    setSuccessMessage('Your ratings and comment have been submitted!');
                    setUserComment('');
                    setUserCommentTitle('');
                    setUserRatings({});
                    setUserProductRating(0);
                } else {
                    console.error("Product not found for the given productId:", productId);
                }
            } else {
                setErrorMessage('Failed to submit your ratings and comment.');
                console.log("Failed to create comment. Response data:", response.data);
            }
        } catch (error) {
            setErrorMessage('Failed to submit your ratings and comment. Please try again.');
            console.error('Error submitting ratings and comment:', error);
        }
    };


    const handleEditReview = () => {
        console.log("Editing review:", selectedReview, "Logged in user:", loggedInUser);
        if (selectedReview && loggedInUser && selectedReview.user.uid === loggedInUser.uid) {
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
    
            console.log("Starting review update...");
    
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
                userProductRating === selectedReview.averageRating &&
                JSON.stringify(userRatings) === JSON.stringify(selectedReview.parameterRatings)) {
                setErrorMessage('Cannot submit a new comment without changing.');
                return;
            }
    
            // Prepare the updated comment data
            const updatedCommentData = {
                title: userCommentTitle,
                content: userComment,
                averageRating: userProductRating,
                parameterRatings: userRatings,
                timestamp: new Date() // 使用新的时间戳
            };
    
            console.log("Updated Comment Data:", updatedCommentData);
    
            // Step: 更新评论内容到 Firestore 中的 Comments 集合
            const commentRef = doc(db, 'Comments', selectedReview.commentId);
            
            console.log("Updating comment in Firestore...");
            await updateDoc(commentRef, updatedCommentData);
            console.log("Comment updated successfully in Firestore");
    
            // 更新本地状态
            console.log("Updating local state...");
            setProductData((prevData) => ({
                ...prevData,
                comments: prevData.comments.map((comment) =>
                    comment.commentId === selectedReview.commentId ? { ...comment, ...updatedCommentData } : comment
                ),
            }));
            console.log("Local state updated with new comment data");
    
            setSuccessMessage('Your review has been updated!');
            setUserComment('');
            setUserCommentTitle('');
            setUserRatings({});
            setUserProductRating(0);
            setSelectedReview(null);
            console.log("Review update completed successfully.");
    
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
                        {/* Display product tags */}
                        <h3>Tags</h3>
                        {productData.tagList || productData.subtagList.length > 0 ? (
                            <div className="tag-container">
                                <span className="tag">{productData.tagList}</span>
                                {productData.subtagList && productData.subtagList.length > 0 && (
                                    productData.subtagList.map((subtag, index) => (
                                        <span key={index} className="tag">{subtag}</span>
                                    ))
                                )}
                            </div>
                        ) : (
                            <p>No tags available for this product.</p>
                        )}
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
                        {(productData.comments || []).map((review, index) => (
                            <div key={index} className="review-card" onClick={() => openModal(review)}>
                                <div className="review-stars">
                                    {[...Array(5)].map((_, starIndex) => (
                                        <FaStar key={starIndex} className={starIndex < review.averageRating ? 'filled-star' : ''} />
                                    ))}
                                </div>
                                <p><strong>{review.title}</strong> by {review.user.username || 'Anonymous Judger'}</p>
                                <p>{review.content.substring(0, 40)}...</p>
                                <p>Posted on: {review.timestamp ? new Date(review.timestamp.seconds * 1000).toLocaleString() : 'N/A'}</p>
                                <div className="review-footer">
                                    <div
                                        className={`review-likes ${likedComments.includes(review.commentId) ? 'liked' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLikeDislike(review, true);
                                        }}
                                    >
                                        <FaThumbsUp
                                            className={`thumbs-up-icon ${likedComments.includes(review.commentId) ? 'filled' : ''}`}
                                        />
                                        {review.likeAmount || 0}
                                    </div>
                                    <div
                                        className={`review-dislikes ${dislikedComments.includes(review.commentId) ? 'disliked' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLikeDislike(review, false);
                                        }}
                                    >
                                        <FaThumbsDown
                                            className={`thumbs-down-icon ${dislikedComments.includes(review.commentId) ? 'filled' : ''}`}
                                        />
                                        {review.dislikeAmount || 0}
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
                        <div className="modal-like-dislike">
                            <div className="modal-like" onClick={() => handleLikeDislike(selectedReview, true)}>
                                <FaThumbsUp className={`thumbs-up-icon ${likedComments.includes(selectedReview.commentId) ? 'liked' : ''}`} />
                                <span>{selectedReview.likeAmount || 0}</span>
                            </div>
                            <div className="modal-dislike" onClick={() => handleLikeDislike(selectedReview, false)}>
                                <FaThumbsDown className={`thumbs-down-icon ${dislikedComments.includes(selectedReview.commentId) ? 'disliked' : ''}`} />
                                <span>{selectedReview.dislikeAmount || 0}</span>
                            </div>
                        </div>
                        <div className="modal-header">
                            {loggedInUser && selectedReview.user.uid === loggedInUser.uid && (
                                <button className="edit-review-button" onClick={handleEditReview}><FaEdit /> Edit</button>
                            )}
                        </div>
                        <h2>{selectedReview.title}</h2>
                        <p><strong>Posted:</strong> {new Date(new Date(selectedReview.timestamp.seconds * 1000)).toLocaleString()}</p>
                        <div className="modal-stars">
                            <span>Overall Rating: </span>
                            {[...Array(5)].map((_, index) => (
                                <FaStar key={index} className={index < selectedReview.averageRating ? 'filled-star' : ''} />
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
                         {/* 添加回复框 */}
        <div className="reply-section">
            <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="reply-input"
            />
            <button onClick={(e) => {
                e.stopPropagation();
                handleAddReply(selectedReview.commentId);
            }}>Reply</button>
        </div>

        {/* 展开和折叠回复 */}
        {selectedReview.replies && selectedReview.replies.length > 0 && (
            <button onClick={(e) => {
                e.stopPropagation();
                toggleExpandReplies(selectedReview.commentId);
            }}>
                {expandedComments[selectedReview.commentId] ? 'Hide Replies' : 'Show Replies'}
            </button>
        )}

        {/* 显示回复内容 */}
        {expandedComments[selectedReview.commentId] && selectedReview.replies?.map((reply, replyIndex) => (
            <div key={replyIndex} className="reply-card">
                <p>{reply.content}</p>
                <span>by {reply.user.username || 'Anonymous'}</span>
            </div>
        ))}
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