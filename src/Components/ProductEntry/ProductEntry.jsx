import React, { useState } from 'react';
import './ProductEntry.css';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';
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
    FaSignOutAlt,
    FaStar,
    FaLightbulb,
    FaBatteryFull,
    FaHdd,
    FaCamera,
    FaShareAlt,
    FaThumbsUp,
    FaExclamationTriangle
} from 'react-icons/fa';
import Slider from "react-slick";

// 设置 Modal 的根元素
Modal.setAppElement('#root');

const ProductEntry = () => {
    // 定义所有需要的状态
    const [isFavorite, setIsFavorite] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const toggleDropdown = () => setDropdownVisible(!isDropdownVisible);

    const reviews = [
        { id: 1, title: "Best on the market", content: "I love this product because the support is great. Please ...", user: "WorldTraveler", likes: 10030, daysAgo: "2 minutes ago", battery: 5, camera: 4, storage: 5 },
        { id: 2, title: "Great value for money", content: "The product is incredible, and I am really satisfied with its performance.", user: "TechGuru", likes: 5000, daysAgo: "1 day ago", battery: 4, camera: 4, storage: 5 },
        { id: 3, title: "Great value for money", content: "The product is incredible, and I am really satisfied with its performance.", user: "TechGuru", likes: 5000, daysAgo: "1 day ago", battery: 4, camera: 4, storage: 5 },

    ];

    // openModal
    const openModal = (review) => {
        console.log("Opening modal for review:", review);  // 调试用日志
        setSelectedReview(review);
        setModalIsOpen(true);
    };

    // CloseModal for the review card
    const closeModal = () => {
        setModalIsOpen(false);
    };

    // Slider
    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 2,
        slidesToScroll: 1,
    };

    // Toggle favorite button
    const handleFavoriteClick = () => {
        setIsFavorite(!isFavorite);
    };

    return (
        <div className="product-entry-page">
            {/* Tab Bar from Homepage */}
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

                <div className="menuContainer">
                    <FaBars className="menuicon" onClick={toggleDropdown} />
                    {isDropdownVisible && (
                        <div className="dropdownMenu">
                            <ul>
                                <li>
                                    <div className="userauth">
                                        <Link to="/loginSignup"><FaUser /> Login/Register</Link>
                                    </div>
                                </li>
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
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Product Review */}
            <div className="product-entry-container">
                <div className="product-info">
                    <div className="product-image">
                        <img src="https://via.placeholder.com/400" alt="Product" />
                    </div>
                    <div className="product-details">
                        <h1>iPhone 16
                            <FaStar
                                className={`favorite-icon ${isFavorite ? 'favorite-active' : ''}`}
                                onClick={handleFavoriteClick}
                            />
                            <button className="report-button">
                                <FaExclamationTriangle /> Report
                            </button>
                        </h1>
                        <p className="average-rating">Average: 5.0 / 5.0</p>
                        <div className="stars">
                            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                        </div>
                        <div className="rating-categories">
                            <ul>
                                <li><span>Battery:</span> <FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></li>
                                <li><span>Storage:</span> <FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></li>
                                <li><span>Camera:</span> <FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></li>
                            </ul>
                        </div>
                        <div className="actions">
                            <button className="like-button">Like This Entry</button>
                            <button className="dislike-button">Dislike This Entry</button>
                        </div>
                        <div className="creator-info">
                            <p>Creator: 123456</p>
                            <button className="share-button"><FaShareAlt /> Share</button>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="reviews-section">
                    <h2>Reviews About This Product</h2>
                    <Slider {...sliderSettings}>
                        {reviews.map((review) => (
                            <div key={review.id} className="review-card" onClick={() => openModal(review)}>
                                <div className="review-stars">
                                    {[...Array(5)].map((_, index) => (
                                        <FaStar key={index} className={index < review.battery ? 'filled-star' : ''} />
                                    ))}
                                </div>
                                <p><strong>{review.title}</strong></p>
                                <p>{review.content.substring(0, 40)}...</p>
                                <p>{review.user} - {review.daysAgo}</p>
                                <div className="review-footer">
                                    <div className="review-likes">
                                        <FaThumbsUp className="thumbs-up-icon" /> {review.likes}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>

                {/* Review Detail Modal */}
                {selectedReview && (
                    <Modal
                        isOpen={modalIsOpen}
                        onRequestClose={closeModal}
                        className="review-modal"
                        overlayClassName="review-modal-overlay"
                    >
                        <h2>{selectedReview.title}</h2>
                        <p><strong>By:</strong> {selectedReview.user}</p>
                        <p><strong>Posted:</strong> {selectedReview.daysAgo}</p>
                        <div className="modal-stars">
                            <span>Overall Rating: </span>
                            {[...Array(5)].map((_, index) => (
                                <FaStar key={index} className={index < selectedReview.battery ? 'filled-star' : ''} />
                            ))}
                        </div>
                        <div className="rating-categories">
                            <p><FaBatteryFull /> Battery: {[...Array(5)].map((_, index) => (
                                <FaStar key={index} className={index < selectedReview.battery ? 'filled-star' : ''} />
                            ))}</p>
                            <p><FaCamera /> Camera: {[...Array(5)].map((_, index) => (
                                <FaStar key={index} className={index < selectedReview.camera ? 'filled-star' : ''} />
                            ))}</p>
                            <p><FaHdd /> Storage: {[...Array(5)].map((_, index) => (
                                <FaStar key={index} className={index < selectedReview.storage ? 'filled-star' : ''} />
                            ))}</p>
                        </div>
                        <p className="review-content">{selectedReview.content}</p>
                        <button className="close-modal-button" onClick={closeModal}>Close</button>
                    </Modal>
                )}

                {/* Write Review Section */}
                <div className="write-review-section">
                    <h2>Judge It Yourself!</h2>
                    <form className="review-form">
                        <input type="text" placeholder="Type Your Title Here" />
                        <textarea placeholder="Write Some Comment Here..."></textarea>
                        <div className="rating-section">
                            <p><FaLightbulb /> Battery Capacity</p>
                            <p><FaHdd /> Storage</p>
                            <p><FaCamera /> Camera</p>
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductEntry;