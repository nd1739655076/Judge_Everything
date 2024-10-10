import React, { useState, useEffect } from 'react';
import './ProductEntry.css';
import { Link, useParams } from 'react-router-dom';
import Modal from 'react-modal';
import { FaStar } from 'react-icons/fa';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore'; // Firestore imports
import Slider from "react-slick";

Modal.setAppElement('#root');

const ProductEntry = () => {
    const { productId } = useParams(); // Get the product ID from URL
    const [productData, setProductData] = useState(null); // State to store product data
    const [parameters, setParameters] = useState([]); // State to store product parameters
    const [userProductRating, setUserProductRating] = useState(0); // Store user's overall product rating
    const [userRatings, setUserRatings] = useState({}); // Store user's ratings for each parameter
    const [userComment, setUserComment] = useState(''); // Store user's general comment
    const [loading, setLoading] = useState(true); // Loading state while fetching data
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const db = getFirestore(); // Initialize Firestore

    // Fetch product data on component mount
    useEffect(() => {
        const fetchProductData = async () => {
            try {
                // Fetch the product data from Firestore
                const productRef = doc(db, 'ProductEntry', productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    setProductData(productSnap.data());

                    // Fetch the parameters associated with the product
                    const paramsQuery = query(collection(db, 'Parameters'), where('productId', '==', productId));
                    const paramsSnapshot = await getDocs(paramsQuery);
                    const paramList = paramsSnapshot.docs.map(doc => doc.data());
                    setParameters(paramList);
                }
            } catch (error) {
                console.error("Error fetching product data: ", error);
            } finally {
                setLoading(false); // Set loading to false once data is fetched
            }
        };

        fetchProductData();
    }, [productId]);

    // Handle user's overall product rating
    const handleProductRatingChange = (rating) => {
        setUserProductRating(rating); // Update the overall product rating
    };

    // Handle user's rating for each parameter
    const handleRatingChange = (paramId, rating) => {
        setUserRatings((prevRatings) => ({
            ...prevRatings,
            [paramId]: rating, // Store rating for each parameter
        }));
    };

    // Handle comment submission
    const handleCommentChange = (e) => {
        setUserComment(e.target.value);
    };

    // Submit user ratings and comment to Firestore
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSuccessMessage('');
            setErrorMessage('');

            // Submit the overall product rating
            const productRef = doc(db, 'ProductEntry', productId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const productData = productSnap.data();
                const newTotalRaters = (productData.averageScore.totalRater || 0) + 1;
                const newTotalScore = (productData.averageScore.totalScore || 0) + userProductRating;
                const newAverageScore = newTotalScore / newTotalRaters;

                // Update product's average rating in Firestore
                await setDoc(productRef, {
                    averageScore: {
                        average: newAverageScore,
                        totalScore: newTotalScore,
                        totalRater: newTotalRaters,
                    }
                }, { merge: true });
            }

            // Submit the user's ratings for each parameter
            for (const [paramId, rating] of Object.entries(userRatings)) {
                const paramRef = doc(db, 'Parameters', paramId);
                const paramSnap = await getDoc(paramRef);

                if (paramSnap.exists()) {
                    const paramData = paramSnap.data();
                    const newTotalRaters = (paramData.totalRaters || 0) + 1;
                    const newTotalScore = (paramData.totalScore || 0) + rating;
                    const newAverageScore = newTotalScore / newTotalRaters;

                    // Update parameter's average rating in Firestore
                    await setDoc(paramRef, {
                        averageScore: {
                            average: newAverageScore,
                            totalScore: newTotalScore,
                            totalRaters: newTotalRaters,
                        }
                    }, { merge: true });
                }
            }

            setSuccessMessage('Your ratings and comment have been submitted!');
            setUserComment(''); // Clear comment input
            setUserRatings({}); // Clear user ratings
            setUserProductRating(0); // Clear product rating
        } catch (error) {
            setErrorMessage('Failed to submit your ratings and comment. Please try again.');
            console.error('Error submitting ratings and comment:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>; // Show a loading state
    }

    if (!productData) {
        return <div>Product not found</div>; // Show a message if the product is not found
    }

    return (
        <div className="product-entry-page">
            <div className="product-entry-container">
                <div className="product-info">
                    <h1>{productData.productName}</h1>
                    <p className="average-rating">Average: {productData.averageScore.average} / 5.0</p>
                    
                    {/* Overall Product Rating */}
                    <h3>Rate this Product</h3>
                    <div className="stars">
                        {[...Array(5)].map((_, index) => (
                            <FaStar key={index} className={index < userProductRating ? 'filled-star' : ''} onClick={() => handleProductRatingChange(index + 1)} />
                        ))}
                    </div>

                    {/* Parameter Ratings */}
                    <div className="rating-categories">
                        <ul>
                            {parameters.map((param, index) => (
                                <li key={index}>
                                    <span>{param.paramName}:</span> 
                                    {[...Array(5)].map((_, starIndex) => (
                                        <FaStar key={starIndex} className={userRatings[param.paramId] >= starIndex + 1 ? 'filled-star' : ''} onClick={() => handleRatingChange(param.paramId, starIndex + 1)} />
                                    ))}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* User Rating and Comment Section */}
                <div className="user-rating-comment">
                    <h3>Judge It Yourself!</h3>

                    {/* Comment Box */}
                    <textarea
                        value={userComment}
                        onChange={handleCommentChange}
                        placeholder="Write your comment here..."
                    ></textarea>

                    {/* Submit Button */}
                    <button onClick={handleSubmit}>Submit</button>

                    {/* Success and Error Messages */}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                </div>
            </div>
        </div>
    );
};

export default ProductEntry;
