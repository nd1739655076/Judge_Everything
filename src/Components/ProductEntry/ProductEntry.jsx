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
    const [relatedProducts, setRelatedProducts] = useState([]);
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
    const [loggedInUser, setLoggedInUser] = useState(undefined);
    const db = getFirestore();
    const [productCreatorExists, setProductCreatorExists] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [expandedComments, setExpandedComments] = useState({});
    const [lastReplyId, setLastReplyId] = useState(null);
    const [replies, setReplies] = useState([]);
    const [allReplies, setAllReplies] = useState([]);
    const [showAllReplies, setShowAllReplies] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [expandedReplies, setExpandedReplies] = useState({});
    const [reportReason, setReportReason] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSuccessMessage, setReportSuccessMessage] = useState('');
    const [reportErrorMessage, setReportErrorMessage] = useState('');

    const modalStyles = {
        content: {
            maxWidth: '600px',
            maxHeight: '80vh',
            margin: 'auto',
            padding: '20px',
            overflowY: 'auto',
            borderRadius: '10px',
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }
    };

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    useEffect(() => {
        if (reportSuccessMessage) {
            const timer = setTimeout(() => {
                setReportSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [reportSuccessMessage]);
    
    useEffect(() => {
        if (reportErrorMessage) {
            const timer = setTimeout(() => {
                setReportErrorMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [reportErrorMessage]);


    const fetchReplies = async (commentId, limit = 3) => {
        const functions = getFunctions();
        const handleCommentRequest = httpsCallable(functions, 'handleCommentRequest');

        try {
            const response = await handleCommentRequest({
                action: 'getTopReplies',
                commentId,
                limit,
                startAfter: lastReplyId || null, // Set startAfter if we have a last reply
            });

            const newReplies = response.data.replies;
            setReplies((prevReplies) => [...prevReplies, ...newReplies]);

            // Update lastReplyId for next batch, if we have more replies
            if (newReplies.length > 0) {
                setLastReplyId(newReplies[newReplies.length - 1].commentId);
            }
        } catch (error) {
            console.error("Error fetching replies:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        if (productData && productData.comments && productData.comments.length > 0) {
            const firstCommentId = productData.comments[0].commentId;
            fetchReplies(firstCommentId);
        }
    }, [productData]);

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
                setLikedComments([]);
                setDislikedComments([]);
                const newLikedComments = [];
                const newDislikedComments = [];
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
                                newLikedComments.push(commentId);
                            }
                            if (commentData.dislikes && commentData.dislikes.includes(loggedInUser.uid)) {
                                newDislikedComments.push(commentId);
                            }
                        }
                        return { ...commentData, commentId };
                    } else {
                        return null;
                    }
                });

                const comments = (await Promise.all(commentPromises)).filter(Boolean);

                setLikedComments(newLikedComments);
                setDislikedComments(newDislikedComments);

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
                limit: 3 // 初始加载前3条回复
            });

            // 检查 response 是否包含有效数据
            if (response?.data?.replies && Array.isArray(response.data.replies)) {
                setReplies(response.data.replies);
                setAllReplies(response.data.replies); // 所有回复
                return response.data.replies;
            } else {
                setReplies([]);
                setAllReplies([]);
                console.warn("No replies found in response data:", response.data);
                return [];
            }
        } catch (error) {
            console.error("Error fetching top replies:", error);
            setReplies([]);
            setAllReplies([]);
            return [];
        }
    };


    const handleShowReplies = (commentId) => {
        setExpandedReplies((prev) => ({
            ...prev,
            [commentId]: !prev[commentId] // 切换显示全部/部分的状态
        }));
    };


    const handleShowAllReplies = () => {
        setShowAllReplies(true);
        setReplies(allReplies);
    };



    // useEffect to fetch logged-in user
useEffect(() => {
    const fetchUserStatus = async () => {
        const userData = await getCurrentLoggedInUser();
        setLoggedInUser(userData); // This will set to null if no user is logged in
    };
    fetchUserStatus();
}, []); // Run once on component mount

// useEffect to fetch product data after loggedInUser is set
useEffect(() => {
    if (productId && loggedInUser !== undefined) {
        fetchProductData();
    }
}, [productId, loggedInUser]); // Run when productId or loggedInUser changes

useEffect(() => {
  if (productData) {
      fetchRelatedProducts();
  }
}, [productData]);

    const fetchRelatedProducts = async () => {
        const functions = getFunctions();
        const getRelatedProducts = httpsCallable(functions, 'handleProductEntryRequest');

        try {
            const response = await getRelatedProducts({
                action: 'getRelatedProducts',
                productId: productId,
            });

            if (response.data.success && Array.isArray(response.data.relatedProducts)) {
                setRelatedProducts(response.data.relatedProducts);
            } else {
                console.error("Failed to fetch related products:", response.data.message);
                setRelatedProducts([]); // Set to empty array if no related products found
            }
        } catch (error) {
            console.error("Error fetching related products:", error);
            setRelatedProducts([]); // Set to empty array on error
        }
    };

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

        if (!replyContent.trim()) {
            setErrorMessage('Reply content cannot be empty.');
            return;
        }

        const functions = getFunctions();
        const handleCommentRequest = httpsCallable(functions, 'handleCommentRequest');

        try {
            const requestData = {
                action: 'addReply',
                content: replyContent.trim(),
                user: { uid: loggedInUser.uid, username: loggedInUser.username },
                productId,
                parentCommentId: commentId
            };
            console.log("Sending request to handleCommentRequest for reply:", requestData);

            const response = await handleCommentRequest(requestData);
            console.log("Response from handleCommentRequest for reply:", response.data);

            if (response.data.success) {
                setReplyContent(''); // Clear input
                setSuccessMessage('Reply added successfully.');

                // Fetch updated replies for selected review and expand replies
                console.log("Fetching updated replies...");
                const updatedReplies = await fetchTopReplies(commentId);

                console.log("Updated replies:", updatedReplies);
                setSelectedReview((prevReview) => ({
                    ...prevReview,
                    replies: updatedReplies,
                }));

                setExpandedComments((prev) => ({
                    ...prev,
                    [commentId]: true
                }));
            } else {
                setErrorMessage('Failed to add reply.');
                console.log("Failed to add reply:", response.data.message);
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            setErrorMessage('An error occurred while adding reply.');
        }
    };
    useEffect(() => {
        if (selectedReview) {
            setSelectedReview((prevReview) => ({
                ...prevReview,
                replies: replies, // 使用最新的 replies 更新
            }));
        }
    }, [replies]);

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
            setUserProductRating(selectedReview.averageRating);
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

    const functions = getFunctions();

    const openReportModal = () => {
        setShowReportModal(true);
    };

    const closeReportModal = () => {
        setShowReportModal(false);
        setReportReason(''); // 清空举报原因
        setReportErrorMessage('');
        setReportSuccessMessage('');
    };

    const handleReportProduct = async () => {
        if (!reportReason) {
            setReportErrorMessage('Please select a reason for reporting.');
            return;
        }

        try {
            // 获取 ProductEntry 文档
            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                const productData = productSnap.data();
                const reportedBy = productData.reportedBy || [];

                // 检查用户是否已举报过该产品
                if (reportedBy.includes(loggedInUser.uid)) {
                    setReportErrorMessage('You have reported the product and will be notified as soon as we process your report.');
                    return;
                }
            } else {
                setReportErrorMessage('Product not found.');
                return;
            }

            const handleReportRequest = httpsCallable(functions, 'handleReportProduct');
            const response = await handleReportRequest({
                productId,
                reportReason,
                reporter: loggedInUser.uid
            });

             if (response.data.success) {
                setReportSuccessMessage('Product reported successfully.');
               await updateDoc(productRef, {
                     reportedBy: arrayUnion(loggedInUser.uid),
                    //reportCount: currentReportCount + 1 
                });

                 closeReportModal();
             } else {
                 setErrorMessage('Failed to report product.');
             }
        } catch (error) {
            console.error('Error reporting product:', error);
            setReportErrorMessage('An error occurred while reporting the product.');
        }
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
                            <button className="report-button" onClick={openReportModal}>
                                <FaExclamationTriangle /> Report
                            </button>
                            {showReportModal && (
                                <Modal
                                    isOpen={showReportModal}
                                    onRequestClose={closeReportModal}
                                    style={modalStyles}
                                    className="review-modal"
                                    overlayClassName="review-modal-overlay"
                                >
                                    <h2>Report Product</h2>
                                    <p>Please select a reason for reporting this product:</p>
                                    <select
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="report-reason-select"
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="Inappropriate Content">Inappropriate Content</option>
                                        <option value="Spam">Spam</option>
                                        <option value="False Title">False Title</option>
                                        <option value="Repeated Title">Repeated Title</option>
                                        <option value="False Parameters">False Parameters</option>
                                    </select>
                                    <div className="button-container">
                                        <button onClick={handleReportProduct} className="submit-report-button">Submit Report</button>
                                        <button onClick={closeReportModal} className="close-button">Close</button>
                                    </div>
                                    {reportErrorMessage && <p className="report-error-message">{reportErrorMessage}</p>}
                                    {reportSuccessMessage && <p className="report-success-message">{reportSuccessMessage}</p>}
                                </Modal>
                            )}
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
                        style={modalStyles}
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

                        {selectedReview.replies && selectedReview.replies.length > 0 && (
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleShowReplies(selectedReview.commentId);
                            }}>
                                {expandedReplies[selectedReview.commentId] ? 'Hide Replies' : 'Show Replies'}
                            </button>
                        )}

                        {/* 回复内容：初始显示3条，点击后显示全部 */}
                        {selectedReview.replies && selectedReview.replies.length > 0 && (
                            expandedReplies[selectedReview.commentId]
                                ? selectedReview.replies.map((reply, replyIndex) => (
                                    <div key={replyIndex} className="reply-card">
                                        <p>{reply.content}</p>
                                        <span>by {reply.user?.username || 'Anonymous'}</span>
                                    </div>
                                ))
                                : selectedReview.replies.slice(0, 3).map((reply, replyIndex) => (
                                    <div key={replyIndex} className="reply-card">
                                        <p>{reply.content}</p>
                                        <span>by {reply.user?.username || 'Anonymous'}</span>
                                    </div>
                                ))
                        )}
                        <button onClick={closeModal} className="close-button">Close</button>
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

            {/* Related Products Section */}
            <div className="related-products-section">
                <h2>Related Products</h2>
                {relatedProducts.length > 0 ? (
                    <div className="related-products-grid">
                        {relatedProducts.map((relatedProduct) => (
                            <div key={relatedProduct.id} className="related-product-card">
                                <img
                                    src={relatedProduct.productImage || "https://via.placeholder.com/150"}
                                    alt={relatedProduct.productName}
                                    className="related-product-image"
                                />
                                <h3>{relatedProduct.productName}</h3>
                                <p>Average Score: {relatedProduct.averageScore.average.toFixed(1)}</p>
                                <Link to={`/product/${relatedProduct.id}`} className="view-details-button">
                                    View Details
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No related products found.</p>
                )}
            </div>

        </div>
    );
};

export default ProductEntry;