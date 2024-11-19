import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import "./R_Admin.css";
import { Link } from "react-router-dom";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";


// Icon imports
import {
  FaSearch,
  FaUser,
  FaBars,
  FaBell,
  FaSignOutAlt,
  FaCog,
} from "react-icons/fa";

Modal.setAppElement("#root");

const R_Admin = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isHeadAdmin, setIsHeadAdmin] = useState(false);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [dailyTasks, setDailyTasks] = useState(20);
  const [reportQueue, setReportQueue] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [imageError, setImageError] = useState("");
  const navigate = useNavigate();

  // Fetch login status and greeting
  useEffect(() => {
    const checkLoginStatus = async () => {
      const localStatusToken = localStorage.getItem("adminAuthToken");
      if (localStatusToken) {
        const handleAdminRequest = httpsCallable(functions, "handleAdminRequest");
        try {
          const response = await handleAdminRequest({
            action: "checkLoginStatus",
            statusToken: localStatusToken,
          });
          if (response.data.success) {
            setIsLoggedIn(true);
            setAdminId(response.data.uid);
            setUsername(response.data.username);
            setIsHeadAdmin(response.data.headAdmin);
          } else {
            setIsLoggedIn(false);
            localStorage.removeItem("adminAuthToken");
          }
        } catch (error) {
          setIsLoggedIn(false);
          localStorage.removeItem("adminAuthToken");
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    const setTimeGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const greetings = ["Good night", "Good morning", "Good afternoon", "Good evening"];
      const index =
        hour >= 5 && hour < 12 ? 1 : hour >= 12 && hour < 17 ? 2 : hour >= 17 && hour < 21 ? 3 : 0;
      setGreeting(greetings[index]);
    };

    checkLoginStatus();
    setTimeGreeting();

    const intervalId = setInterval(() => {
      checkLoginStatus();
      setTimeGreeting();
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  // Fetch today's tasks and report queue
  useEffect(() => {
    if (isLoggedIn) {
      fetchTodayTasks();
      fetchReportQueue();
    }
  }, [isLoggedIn]);

  const fetchTodayTasks = async () => {
    const handleAdminTasksRequest = httpsCallable(functions, "handleAdminTasksRequest");
    try {
      const response = await handleAdminTasksRequest({ adminId, action: "getTodayTasks" });
      if (response.data.success) {
        setTasksCompleted(response.data.tasksCompleted);
        setDailyTasks(response.data.dailyTasks);
      }
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
    }
  };

  const fetchReportQueue = async () => {
    const handleAdminTasksRequest = httpsCallable(functions, "handleAdminTasksRequest");

    try {
      const response = await handleAdminTasksRequest({ action: "getReportQueue" });
      if (response.data.success) {
        const updatedQueue = response.data.queue.map((product) => ({
          ...product,
          isLocked: product.isLocked || false,
          lockedBy: product.lockedBy || "",
        }));
        setReportQueue(updatedQueue);
      }
    } catch (error) {
      console.error("Error fetching report queue:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  const handleEditProduct = async (product) => {
    const handleProductLock = httpsCallable(functions, "handleProductLock");

    try {
      const response = await handleProductLock({
        productId: product.id,
        adminId: adminId, // 当前登录管理员的 ID
        action: "lock",
      });

      if (response.data.success) {
        // 成功锁定，跳转到编辑页面
        window.location.href = `/admin/edit/${product.id}`;
      } else {
        // 如果已被锁定，显示提示信息
        alert(
          `Another admin (${response.data.lockedBy}) is working on this report. Please try again later.`
        );
      }
    } catch (error) {
      console.error("Error locking product:", error);
      alert("An error occurred while trying to lock the product.");
    }
  };


  const handleDeleteProduct = async (productId) => {
    const handleAdminTasksRequest = httpsCallable(functions, "handleAdminTasksRequest");
    try {
      const response = await handleAdminTasksRequest({
        action: "deleteProduct",
        productId, // 传递产品 ID
      });
  
      if (response.data.success) {
        alert("Product deleted successfully!");
        // 更新 UI：移除已删除的产品
        setReportQueue((prevQueue) =>
          prevQueue.filter((product) => product.id !== productId)
        );
        navigate("/admin/regularHome");
      } else {
        alert(`Failed to delete the product: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Error deleting the product:", error);
      alert("An error occurred while deleting the product.");
    }
  };

  const handleLogout = async () => {
    const localStatusToken = localStorage.getItem("adminAuthToken");
    if (localStatusToken) {
      const handleAdminRequest = httpsCallable(functions, "handleAdminRequest");
      try {
        const response = await handleAdminRequest({
          action: "logout",
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          localStorage.removeItem("adminAuthToken");
          setIsLoggedIn(false);
          setAdminId("");
          setUsername("");
          setIsHeadAdmin(false);
          window.location.reload();
        }
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

  const openModal = (product) => {
    setSelectedProduct(product);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="r-admin-homepage">
      {/* Navigation Bar */}
      <div className="r-admin-navbar">
        <div className="r-admin-logoTitle">
          <h1>Judge Everything</h1>
        </div>
        <div className="r-admin-navlinks">
          <a href="/admin/regularHome">Home</a>
          <a href="#">Todo List</a>
          <a href="#">Finished Tasks</a>
        </div>
        <div className="r-admin-searchbar">
          <FaSearch />
          <input type="text" placeholder="Search" />
        </div>
        {isLoggedIn ? (
          <div className="r-admin-currentUserStatus">
            <div className="r-admin-greeting">{greeting}!</div>
            <div className="r-admin-currentUserStatusInfo">
              <FaUser />
              <span className="r-admin-admin-title">{isHeadAdmin ? "Head Admin" : "Admin"}</span>
              <span className="r-admin-username">{username}</span>
              <FaSignOutAlt
                onClick={handleLogout}
                title="Logout"
                className="r-admin-logout-icon"
              />
            </div>
          </div>
        ) : (
          <div className="r-admin-login-prompt">
            <p>Please log in</p>
          </div>
        )}
        <div className="r-admin-menuContainer">
          <FaBars className="r-admin-menuicon" onClick={toggleDropdown} />
          {isDropdownVisible && (
            <div className="r-admin-dropdownMenu">
              <ul>
                {!isLoggedIn ? (
                  <li>
                    <div className="r-admin-adminauth">
                      <Link to="/admin">
                        <FaUser /> Login{" "}
                      </Link>
                    </div>
                  </li>
                ) : (
                  <>
                    <li>
                      <div className="r-admin-notifcations">
                        <a href="#">
                          <FaBell /> Notification
                        </a>
                      </div>
                    </li>
                    <li>
                      <div className="r-admin-settings">
                        <Link to="#">
                          <FaCog /> Your Account
                        </Link>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="r-admin-main-content">
        <div className="r-admin-today-tasks">
          <h2>Today's Tasks</h2>
          <p>
            {tasksCompleted}/{dailyTasks}
          </p>
        </div>

        <div className="r-admin-report-queue">
          <h2>Report Queue</h2>
          {reportQueue.length > 0 ? (
            reportQueue.map((product) => (
              <div
                key={product.id}
                className={`r-admin-report-item ${product.isLocked ? "locked-product" : ""
                  }`}
                onClick={() =>
                  product.isLocked
                    ? alert(`This product is locked by ${product.lockedBy}.`)
                    : openModal(product)
                }
              >
                <img
                  src={product.productImage}
                  alt={product.productName}
                  className="r-admin-product-image"
                />
                <div className="r-admin-product-info">
                  <div className="r-admin-product-name">
                    <strong>Product Name:</strong> {product.productName}
                  </div>
                  <div className="r-admin-product-description">
                    <strong>Description:</strong> {product.description}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No reports to review.</p>
          )}
        </div>
      </div>

      {/* Modal for Product Details */}
      {selectedProduct && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          className="r-admin-modal"
          overlayClassName="r-admin-modal-overlay"
        >
          <div className="r-admin-modal-content">
            <div className="r-admin-modal-header">
              <img
                src={selectedProduct.productImage}
                alt={selectedProduct.productName}
                className="r-admin-modal-image"
              />
              <h2>{selectedProduct.productName}</h2>
            </div>
            <div className="r-admin-modal-section">
              <p><strong>Description:</strong> {selectedProduct.description}</p>
              <p><strong>Creator:</strong> {selectedProduct.creator}</p>
            </div>
            <div className="r-admin-modal-section">
              <h3>Parameters</h3>
              <ul>
                {selectedProduct.parametorList.map((param, index) => (
                  <li key={index}>{param || "N/A"}</li>
                ))}
              </ul>
            </div>
            <div className="r-admin-modal-section">
              <h3>Tags</h3>
              <p>{selectedProduct.tagList}</p>
              <h3>Subtags</h3>
              <p>{selectedProduct.subtagList}</p>
            </div>
            <div className="r-admin-modal-section">
              <h3>Comments</h3>
              <p>{selectedProduct.commentList.length}</p>
            </div>
            <div className="r-admin-modal-section">
              <h3>Reports</h3>
              {selectedProduct.reportList && selectedProduct.reportList.length > 0 ? (
                <ul>
                  {selectedProduct.reportList.map((report, index) => (
                    <li key={index}>
                      <p><strong>Reporter:</strong> {report.reporter}</p>
                      <p><strong>Reason:</strong> {report.reportReason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No reports available</p>
              )}
            </div>
            <div className="r-admin-modal-section">
              <p>
                <strong>Report Flag Created At:</strong>{" "}
                {selectedProduct.flaggedTime
                  ? new Date(selectedProduct.flaggedTime.seconds * 1000).toLocaleString()
                  : "N/A"}
              </p>
            </div>
            <div className="r-admin-product-actions">
              <button
                className="r-admin-button go-to-product"
                onClick={() => handleEditProduct(selectedProduct)}
              >
                Edit the Product
              </button>
              <button
                className="r-admin-button delete-product"
                onClick={() => handleDeleteProduct(selectedProduct.id)}
              >
                Delete the Product
              </button>
            </div>
            <button onClick={closeModal} className="r-admin-close-button">
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default R_Admin;
