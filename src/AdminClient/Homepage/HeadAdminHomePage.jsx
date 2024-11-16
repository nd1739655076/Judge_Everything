import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'; //change later
import './HeadAdminHomePage.css';

import { Link } from 'react-router-dom';
// icon import
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaBell, FaCog, FaSignOutAlt } from 'react-icons/fa';

const HeadAdminHomepage = () => {

  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [username, setUsername] = useState("");
  const [greeting, setGreeting] = useState("");
  const [isHeadAdmin, setIsHeadAdmin] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminListPage, setAdminListPage] = useState(1);
  const [totalAdminPages, setTotalAdminPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [role, setRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'delete', or null
  const openModal = (type) => setModalType(type);
  const closeModal = () => {
    setLoading(false);
    setErrorMessage("");
    setSuccessMessage("");
    setNewUsername("");
    setPassword("");
    setRePassword("");
    setRole("");
    setModalType(null)
  }; 

  useEffect(() => {
    const checkLoginStatus = async () => {
      const localStatusToken = localStorage.getItem('authToken');
      if (localStatusToken) {
        const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
        try {
          const response = await handleAdminRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
          if (response.data.success) {
            setIsLoggedIn(true);
            setAdminId(response.data.uid);
            setUsername(response.data.username);
            setIsHeadAdmin(response.data.headAdmin);
          } else {
            console.log(response.data.message);
            setIsLoggedIn(false);
            setUsername("");
            setIsHeadAdmin(false);
            localStorage.removeItem('authToken');
          }
        } catch (error) {
          console.log("error verifying token");
          setIsLoggedIn(false);
          setUsername("");
          setIsHeadAdmin(false);
          localStorage.removeItem('authToken');
        }
      } else {
        console.log("no local token");
        setIsLoggedIn(false);
        setUsername("");
        setIsHeadAdmin(false);
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
    checkLoginStatus();
    setTimeGreeting();

    const intervalId = setInterval(() => {
      checkLoginStatus();
      setTimeGreeting();
    }, 100000);
    return () => clearInterval(intervalId);
  }, []);
  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };
  const handleLogout = async () => {
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
      try {
        const response = await handleAdminRequest({
          action: 'logout',
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          localStorage.removeItem('authToken');
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

  const fetchAdmins = async () => {
    setLoading(true);
    const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
    try {
      const response = await handleAdminRequest({
        action: 'fetchAdmin'
      });
      if (response.data.success) {
        const adminList = response.data.adminList;
        console.log("admin list:", adminList);
        await setAdmins(adminList);
        setTotalAdminPages(Math.ceil(adminList.length / 5));
        setLoading(false);
      } else {
        console.error(`Could not fetch admins list: ${response.data.message}`);
      }
    } catch(error) {
      console.error("Error fetching admins list: ", error);
    }
    setLoading(false);
  };
  useEffect(() => {
    if (isLoggedIn) {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleCreateAdmin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(false);        
    if (!newUsername.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter a password.");
      return;
    }
    if (!rePassword.trim()) {
      setErrorMessage("Please re-enter the password.");
      return;
    }
    if (!role.trim()) {
      setErrorMessage("Please select an admin type.");
      return;
    }
    if (password !== rePassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    setLoading(true);
    const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
    try {
      const newHeadAdmin = (role === "true");
      const response = await handleAdminRequest({
        action: 'create',
        username: newUsername,
        password: password,
        headAdmin: newHeadAdmin
      });
      if (response.data.success) {
        setLoading(false);
        console.log("New admin account created successfully!");
        setSuccessMessage("New admin account created successfully!");
        setTimeout(() => {
          closeModal();
        }, 1000);
        window.location.reload();
      } else {
        setLoading(false);
        console.error(`Could not create admin account: ${response.data.message}`);
        setErrorMessage(`Could not create admin account: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error creating admin account: ", error);
      setErrorMessage(`Error creating admin account: ${error}`)
    }
  };

  const handleDeleteAdmin = async (deleteAdminId) => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);
    const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
    try {
      console.log("start delete admin ", deleteAdminId);
      const response = await handleAdminRequest({
        action: 'delete',
        uid: deleteAdminId
      });
      if (response.data.success) {
        setLoading(false);
        console.log("Admin", deleteAdminId, " deleted successfully!");
        setErrorMessage("");
        setSuccessMessage("Admin account successfully deleted!");
        setTimeout(() => {
          closeModal();
        }, 1000);
        window.location.reload();
      } else {
        setLoading(false);
        setSuccessMessage("");
        console.error(`Could not delete admin account: ${response.data.message}`);
        setErrorMessage(`Could not delete admin account: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      setSuccessMessage("");
      console.error("Error deleting admin account: ", error);
      setErrorMessage(`Error deleting admin account: ${error}`)
    }
  }


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
          <a href="/admin/home">Home</a>
          <a href="#">Admin List</a>
          <a href="#">Flagged Products</a>
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
              <span className="admin-title">{isHeadAdmin ? ("Head Admin "):("Admin ")}</span>
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
            <p>Please log in</p>
          </div>
        )}
        <div className="menuContainer">
          <FaBars className="menuicon" onClick={toggleDropdown} />
          {isDropdownVisible && (
            <div className="dropdownMenu">
              <ul>
                {!isLoggedIn ? (
                  <li>
                    <div className="adminauth">
                      <Link to="/admin"><FaUser /> Login </Link>
                    </div>
                  </li>
                ) : (
                  <>
                  {/* These links are not yet implemented! */}
                    <li>
                      <div className="notifcations">
                        <a href="#"><FaBell /> Notifaction</a>
                      </div>
                    </li>
                    <li>
                      <div className="settings">
                        {/* <Link to="/accountSettings"><FaCog /> Your Account</Link> */}
                        <Link to="#"><FaCog /> Your Account</Link>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
        {/* Admin List Section */}
        {isHeadAdmin && <section className="admin-list">
            <div className="admin-list-container">
                <div className="admin-list-header">
                    <h2>Admin List</h2>
                    <button className="create-admin-btn" onClick={() => openModal("create")}>
                        Create Admin Account
                    </button>
                    {/* Conditionally Render Modals */}
                    {modalType === "create" && (
                        <div className="admin-modal-overlay">
                        <div className="modal">
                            <h3>Create Admin Account</h3>
                            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
                                <input type="text" placeholder="Username" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                                <input type="password" placeholder="Re-enter Password" required value={rePassword} onChange={(e) => setRePassword(e.target.value)}/>
                                <select required value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="">Select Role</option>
                                    <option value="true">Head Admin</option>
                                    <option value="false">Regular Admin</option>
                                </select>
                                <div className="admin-home-message">
                                    {loading && <div className="loadingMessage">Loading...</div>}
                                    {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                                    {successMessage && <p className="successMessage">{successMessage}</p>}
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-create-admin-btn" onClick={closeModal}>
                                    Cancel
                                    </button>
                                    <button type="button" className="confirm-create-admin-btn"  onClick={handleCreateAdmin}>
                                    Create
                                    </button>
                                </div>
                            </form>
                        </div>
                        </div>
                    )}
                </div>              
                    {admins.slice((adminListPage-1)*5, ((adminListPage-1)*5)+5).map((admin) => (
                    <div key={admin.id} className="admin-item">
                        <div className="admin-info">
                        <span className="admin-id">{admin.id}</span>
                        <span className="admin-username">{admin.username}</span>
                        </div>
                        {admin.headAdmin ? (
                        <div className="head-admin-role">Head Admin</div>
                        ) : (
                        <div className="admin-actions">
                            <button className="edit-btn" onClick={() => openModal("edit")}>Edit</button>
                            <button className="delete-btn" onClick={() => openModal("delete")}>Delete</button>
                        </div>
                        )}
                      {/* Conditionally Render Modals */}
                      {modalType === "delete" && (
                          <div className="admin-modal-overlay">
                            <div className="modal">
                              <h3>Delete Admin Account</h3>        
                              <p>Are you sure you want to delete {admin.id}: {admin.username}?</p>
                              <div className="admin-home-message">
                                {loading && <div className="loadingMessage">Loading...</div>}
                                {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                                {successMessage && <p className="successMessage">{successMessage}</p>}
                              </div>
                              <div className="modal-actions">
                                <button type="button" className="cancel-delete-admin-btn" onClick={closeModal}>
                                  Cancel
                                </button>
                                <button type="button" className="confirm-delete-admin-btn"  onClick={() => handleDeleteAdmin(admin.id)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                      )}
                    </div>
                    ))}
            </div>
            {/* Pagination */}
            <div className="paging">
                <button disabled={adminListPage === 1} onClick={() => setAdminListPage(adminListPage - 1)}>
                    &larr; Prev</button>
                {/* Display all pages directly if there are less than 5 total pages */}
                {totalAdminPages < 5 ? (
                    [...Array(totalAdminPages)].map((_, index) => (
                        <span
                            key={index + 1}
                            className={(adminListPage === index + 1) ? "active" : ""}
                            onClick={() => setAdminListPage(index + 1)}>
                            {index + 1}
                        </span>
                    ))
                ) : (
                    <>
                    {adminListPage > 1 && <span onClick={() => setAdminListPage(1)}>1</span>}
                    {adminListPage > 3 && <span>...</span>}
                    {/* Show current page and surrounding pages */}
                    {adminListPage > 1 && (
                        <span onClick={() => setAdminListPage(adminListPage - 1)}>
                            {adminListPage - 1}
                        </span>
                    )}
                    <span className="active" onClick={() => setAdminListPage(adminListPage)}>
                        {adminListPage}
                    </span>
                    {adminListPage < totalAdminPages && (
                        <span onClick={() => setAdminListPage(adminListPage + 1)}>
                            {adminListPage + 1}
                        </span>
                    )}
                    {(adminListPage < (totalAdminPages - 2)) && <span>...</span>}
                    {adminListPage < totalAdminPages && (
                        <span onClick={() => setAdminListPage(totalAdminPages)}>{totalAdminPages}</span>
                    )}
                    </>
                )}
                <button disabled={adminListPage === totalAdminPages} onClick={() => setAdminListPage(adminListPage + 1)}>
                    Next &rarr;</button>
            </div>
        </section>
        }
      

    </div>

  );

};

export default HeadAdminHomepage;