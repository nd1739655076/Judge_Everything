import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { Link } from "react-router-dom";
import Modal from "react-modal";
import styles from "./Notification.module.css";
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter, FaBell, FaHistory, FaUser, FaSignOutAlt, FaBars } from "react-icons/fa";

Modal.setAppElement("#root");

const Notification = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [deleteWarning, setDeleteWarning] = useState(false);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [username, setUsername] = useState("");
    const [greeting, setGreeting] = useState("");
    const [uid, setUid] = useState("");
    const [deleteMode, setDeleteMode] = useState(false);
    const [selectedToDelete, setSelectedToDelete] = useState([]);
    const [showWarning, setShowWarning] = useState(false);
    const [clearAll, setClearAll] = useState(false);
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
                        // setLoading(false);
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
    const toggleDropdown = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    useEffect(() => {
        if (isLoggedIn && uid) {
            fetchNotifications();
        }
    }, [isLoggedIn, uid]);

    const fetchNotifications = async () => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        try {
            console.log("Fetching notifications for UID:", uid);
            const response = await handleUserRequest({
                action: "getNotifications",
                uid: uid
            });
            console.log("Response from server:", response); // 打印完整响应
            console.log("Fetched notifications:", response.data.notifications);
            if (response.data.success) {
                console.log("Fetched notifications:", response.data.notifications);
                setNotifications(response.data.notifications);
            } else {
                console.error("Error message from server:", response.data.message);
                setErrorMessage(response.data.message || "Failed to fetch notifications.");
            }
        } catch (error) {
            setErrorMessage("Error fetching notifications.");
        }
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
                    setUid("");
                    setUsername("");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error logging out:", error);
            }
        }
    };


    const handleNotificationClick = async (notification, index) => {
        setSelectedNotification(notification);

        if (notification.isNew) {
            const handleUserRequest = httpsCallable(functions, "handleUserRequest");
            try {
                const response = await handleUserRequest({
                    action: "markNotificationAsRead",
                    uid: uid,
                    index,
                });

                if (response.data.success) {
                    setNotifications((prevNotifications) =>
                        prevNotifications.map((n, i) =>
                            i === index ? { ...n, isNew: false } : n
                        )
                    );
                }
            } catch (error) {
                setErrorMessage("Failed to mark notification as read.");
            }
        }
    };

    const handleViewNotification = async (index) => {
        const notification = notifications[index];
        if (notification.isNew) {
            const handleUserRequest = httpsCallable(functions, "handleUserRequest");
            await handleUserRequest({
                action: "deleteNotification",
                uid,
                index,
            });
        }
        setSelectedNotification(notification);
        setNotifications((prev) =>
            prev.map((notif, i) =>
                i === index ? { ...notif, isNew: false } : notif
            )
        );
    };

    const handleDeleteNotifications = async () => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        const includesUnread = selectedToDelete.some(
            (index) => notifications[index].isNew
        );
        if (includesUnread) {
            setShowWarning(true);
            return;
        }

        for (let index of selectedToDelete) {
            await handleUserRequest({
                action: "deleteNotification",
                uid,
                index,
            });
        }
        fetchNotifications();
        setDeleteMode(false);
        setSelectedToDelete([]);
    };

    const performDeleteNotifications = async () => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        try {
            const response = await handleUserRequest({
                action: "deleteNotifications",
                uid: uid,
                indices: selectedNotifications,
            });

            if (response.data.success) {
                setNotifications((prevNotifications) =>
                    prevNotifications.filter(
                        (_, index) => !selectedNotifications.includes(index)
                    )
                );
                setIsDeleteMode(false);
                setSelectedNotifications([]);
                setDeleteWarning(false);
            } else {
                setErrorMessage("Failed to delete notifications.");
            }
        } catch (error) {
            setErrorMessage("Error while deleting notifications.");
        }
    };

    const handleClearNotifications = async () => {
        const includesUnread = notifications.some((notif) => notif.isNew);
        if (includesUnread) {
            setShowWarning(true);
            setClearAll(true);
            return;
        }
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        await handleUserRequest({
            action: "clearNotifications",
            uid,
        });
        setNotifications([]);
    };

    const confirmClearAll = async () => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        await handleUserRequest({
            action: "clearNotifications",
            uid,
        });
        setNotifications([]);
        setShowWarning(false);
        setClearAll(false);
    };

    const performClearNotifications = async () => {
        const handleUserRequest = httpsCallable(functions, "handleUserRequest");
        try {
            const response = await handleUserRequest({
                action: "clearNotifications",
                uid: uid,
            });

            if (response.data.success) {
                setNotifications([]);
                setDeleteWarning(false);
            } else {
                setErrorMessage("Failed to clear notifications.");
            }
        } catch (error) {
            setErrorMessage("Error while clearing notifications.");
        }
    };

    const toggleDeleteMode = () => {
        setIsDeleteMode(!isDeleteMode);
        setSelectedNotifications([]);
    };

    const toggleSelection = (index) => {
        setSelectedNotifications((prevSelected) =>
            prevSelected.includes(index)
                ? prevSelected.filter((i) => i !== index)
                : [...prevSelected, index]
        );
    };

    return (
        <div className={styles.notificationPage}>
            {/* Top Bar */}
            <div className={styles.topbar}>
                <div className={styles.contactinfo}>
                    <FaPhone /> (225) 555-0118 | <FaEnvelope /> song748@purdue.edu
                </div>
                <div className={styles.subscribeinfo}>
                    Subscribe with email to get newest product information! 🎉
                </div>
                <div className={styles.socialicons}>
                    <p>Follow Us :</p>
                    <a href="#"><FaInstagram /></a>
                    <a href="#"><FaYoutube /></a>
                    <a href="#"><FaTwitter /></a>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className={styles.navbar}>
                <div className={styles.logoTitle}>
                    <h1>Judge Everything</h1>
                </div>
                <div className={styles.navlinks}>
                    <a href="/">Home</a>
                    <a href="#">About</a>
                    <a href="/contact">Support</a>
                </div>
                <div className={styles.currentUserStatus}>
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
                </div>
                <div className={styles.menuContainer}>
                    <FaBars className={styles.menuicon} onClick={toggleDropdown} />
                    {isDropdownVisible && (
                        <div className={styles.dropdownMenu}>
                            <ul>
                                {!isLoggedIn ? (
                                    <li>
                                        <Link to="/loginSignup">
                                            <FaUser /> Login/Register
                                        </Link>
                                    </li>
                                ) : (
                                    <>
                                        <li>
                                            <Link to={`/notification/${uid}`}>
                                                <FaBell /> Notifications
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/history">
                                                <FaHistory /> History
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/accountSettings">
                                                <FaUser /> Your Account
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.notificationContainer}>
                <h2>Notifications</h2>
                <div className={styles.notificationList}>
                    {notifications.map((notification, index) => (
                        <div
                            key={index}
                            className={`${styles.notificationItem}`}
                        >
                            {deleteMode && (
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    onChange={(e) => {
                                        setSelectedToDelete((prev) =>
                                            e.target.checked
                                                ? [...prev, index]
                                                : prev.filter((i) => i !== index)
                                        );
                                    }}
                                />
                            )}
                            <div
                                className={styles.notificationContent}
                                onClick={() => handleNotificationClick(notification, index)}
                            >
                                <div className={styles.notificationHeader}>
                                    <p className={styles.notificationTime}>
                                        {notification.time
                                            ? new Date(
                                                notification.time._seconds * 1000
                                            ).toLocaleString()
                                            : "No Date Available"}
                                    </p>
                                    {notification.isNew && (
                                        <span className={styles.newDot}>
                                            <FaBell/>
                                        </span>
                                    )}
                                </div>
                                <p className={styles.notificationText}>
                                    {notification.content.substring(0, 50)}...
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.actions}>
                    {!deleteMode ? (
                        <>
                            <button
                                className={styles.clearButton}
                                onClick={handleClearNotifications}
                            >
                                Clear Notifications
                            </button>
                            <button
                                className={styles.deleteButton}
                                onClick={() => setDeleteMode(true)}
                            >
                                Delete Selected Notifications
                            </button>
                        </>
                    ) : (
                        <button
                            className={styles.deleteConfirmButton}
                            onClick={handleDeleteNotifications}
                        >
                            Confirm Delete
                        </button>
                    )}
                </div>

                <Modal
                    isOpen={!!selectedNotification}
                    onRequestClose={() => setSelectedNotification(null)}
                    className={styles.modal}
                    overlayClassName={styles.overlay}
                >
                    {selectedNotification && (
                        <div className={styles.modalContent}>
                            <h2>Notification Details</h2>
                            <p>
                                <strong>Time:</strong>{" "}
                                {selectedNotification.time
                                    ? new Date(
                                        selectedNotification.time._seconds * 1000
                                    ).toLocaleString()
                                    : "No Date Available"}
                            </p>
                            <p>
                                <strong>From:</strong> {selectedNotification.sender}
                            </p>
                            <p>
                                <strong>Content:</strong> {selectedNotification.content}
                            </p>
                            <button
                                className={styles.modalCloseButton}
                                onClick={() => setSelectedNotification(null)}
                            >
                                Close
                            </button>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
};

export default Notification;
