import React, { useState, useEffect } from "react";
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'; //change later
import './HeadAdminHomePage.css';

import { Link } from 'react-router-dom';
// icon import
import { FaPhone, FaEnvelope, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import { FaSearch, FaUser, FaBars, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { RiDeleteBinFill } from "react-icons/ri";

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
  const [editUsername, setEditUsername] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [editRole, setEditRole] = useState(false);
  const [modalType, setModalType] = useState(null); // 'create', 'edit', 'delete', or null
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const openModal = (type, admin) => {
    setModalType(type);
    setSelectedAdmin(admin);
  };
  const closeModal = () => {
    setLoading(false);
    setErrorMessage("");
    setSuccessMessage("");
    setNewUsername("");
    setPassword("");
    setRePassword("");
    setRole("");
    setEditUsername(false);
    setEditPassword(false);
    setEditRole(false);
    setModalType(null);
    setSelectedAdmin(null);
  }; 

  useEffect(() => {
    const checkLoginStatus = async () => {
      console.log("start status check");
      const localStatusToken = localStorage.getItem('adminAuthToken');
      if (localStatusToken) {
        const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
        try {
          const response = await handleAdminRequest({
            action: 'checkLoginStatus',
            statusToken: localStatusToken,
          });
          if (response.data.success) {
            console.log("check success");
            setIsLoggedIn(true);
            setAdminId(response.data.uid);
            setUsername(response.data.username);
            setIsHeadAdmin(response.data.headAdmin);
          } else {
            console.log("check fail");
            console.log(response.data.message);
            setIsLoggedIn(false);
            setUsername("");
            setIsHeadAdmin(false);
            localStorage.removeItem('adminAuthToken');
          }
        } catch (error) {
          console.log("error verifying token");
          setIsLoggedIn(false);
          setUsername("");
          setIsHeadAdmin(false);
          localStorage.removeItem('adminAuthToken');
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
    console.log("start logout");
    const localStatusToken = localStorage.getItem('adminAuthToken');
    if (localStatusToken) {
      const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
      try {
        const response = await handleAdminRequest({
          action: 'logout',
          statusToken: localStatusToken,
        });
        if (response.data.success) {
          localStorage.removeItem('adminAuthToken');
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

  const handleEditAdmin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(false);
    if ((!editUsername) && (!editPassword) && (!editRole)) {
      setErrorMessage("You have not made any modifications.");
      return;
    }
    if ((editUsername) && (!newUsername.trim())) {
      setErrorMessage("Please enter a new username or cancel changes.");
      return;
    }
    if ((editPassword) && (!password.trim())) {
      setErrorMessage("Please enter a new password or cancel changes.");
      return;
    }
    if ((editRole) && (!role.trim())) {
      setErrorMessage("Please select an admin type or cancel changes.");
      return;
    }
    const updatedUsername = editUsername ? newUsername : selectedAdmin.username;
    let updatedRole = editRole ? role : selectedAdmin.headAdmin;
    const updatedPassword = editPassword ? password : null;
    setLoading(true);
    const handleAdminRequest = httpsCallable(functions, 'handleAdminRequest');
    try {
      updatedRole = (updatedRole === "true") || (updatedRole === true);
      const response = await handleAdminRequest({
        action: 'edit',
        uid: selectedAdmin.id,
        username: updatedUsername,
        password: updatedPassword,
        headAdmin: updatedRole
      });
      if (response.data.success) {
        setLoading(false);
        console.log("Admin account information edited successfully!");
        setSuccessMessage("Admin account information edited successfully!");
        setTimeout(() => {
          closeModal();
        }, 1000);
        window.location.reload();
      } else {
        setLoading(false);
        console.error(`Could not edit admin account: ${response.data.message}`);
        setErrorMessage(`Could not edit admin account: ${response.data.message}`);
      }
    } catch (error) {
      setLoading(false);
      console.error("Error editing admin account: ", error);
      setErrorMessage(`Error editing admin account: ${error}`)
    }
  }

  const [displaySearch, setDisplaySearch] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [searchMesage, setSearchMessage] = useState("");

  const handleSearch = async () => {
    setDisplaySearch(true);
    if (searchKeyword === "") {
      setSearchMessage("Please enter a keyword for searching.");
      return;
    }
    setSearchMessage("Seaching...");
    
    const filteredItems = admins.filter((admin) =>
      admin.username.toLowerCase().includes(searchKeyword.toLowerCase()) 
    );
    // Sort matching items (a and b on each comparison) based on relevance
    const sortedItems = filteredItems.sort((a, b) => {
      const query = searchKeyword.toLowerCase(); 
      const aName = a.username.toLowerCase();
      const bName = b.username.toLowerCase();
      // Exact match: score 2; Start with the query: score 1; otherwise: score 0
      const aScore = (aName === query) ? (2) : (aName.startsWith(query) ? 1 : 0); 
      const bScore = (bName === query) ? (2) : (bName.startsWith(query) ? 1 : 0);
      if (aScore === bScore) {
        return aName.localeCompare(bName);
      }

      return bScore - aScore;
    });
    await setSearchResult(sortedItems);
    if (sortedItems.length === 0) {
      setSearchMessage("No accounts with provided keyword available.");
    } else {
      setSearchMessage("");
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
          <a href="/headadmin/home">Admin List</a>
        </div>
        <div>
          <div  className="search-admin-account">
            <div className="admin-account-searchbar">
              <FaSearch />
              <input type="text" placeholder="Search Admin Account"
                value={searchKeyword} onChange={(e) => {setSearchKeyword(e.target.value)}} />
            </div>
            <button onClick={() =>{handleSearch()}}>Search</button>
            {displaySearch && 
              <button onClick={() => {setDisplaySearch(false); setSearchMessage(""); setSearchResult([]); setSearchKeyword("");}}>
                Clear
              </button>}
          </div>
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
                    <li>
                      <div>
                        <a
                          onClick={() =>
                            openModal("delete", {
                              id: adminId,
                              username: username,
                              headAdmin: isHeadAdmin,
                            })
                          }
                        >
                          <RiDeleteBinFill />
                          Delete Account
                        </a>
                      </div>
                    </li>
                    <li>
                      <div>
                        <a
                          onClick={() =>
                            openModal("edit", {
                              id: adminId,
                              username: username,
                              headAdmin: isHeadAdmin,
                            })
                          }
                        >
                          <FaCog />
                          Edit Account
                        </a>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      {/* Search Result Section */}
      {isHeadAdmin && displaySearch && <section className="admin-list">
        <div className="admin-list-container">
          <div className="admin-list-header">
            <h2>Search Result</h2>
          </div>              
          {searchResult.length === 0 ? (
            <div>
              <p>{searchMesage}</p>
            </div>
          ) : (
            searchResult.slice(0, 15).map((admin) => (
              <div key={admin.id} className="admin-item">
                <div className="admin-info">
                  <span className="admin-id">{admin.id}</span>
                  <span className="admin-username">{admin.username}</span>
                </div>
                {admin.headAdmin ? (
                  <div className="head-admin-role">Head Admin</div>
                  ) : (
                  <div className="admin-actions">
                    <button className="edit-btn" onClick={() => openModal("edit", admin)}>Edit</button>
                    <button className="delete-btn" onClick={() => openModal("delete", admin)}>Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>}
        {/* Admin List Section */}
        {isHeadAdmin && <section className="admin-list">
            <div className="admin-list-container">
                <div className="admin-list-header">
                    <h2>Admin List</h2>
                    <button className="create-admin-btn" onClick={() => openModal("create", null)}>
                        Create Admin Account
                    </button>
                    {/* Conditionally Render Create Modal */}
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
                            <button className="edit-btn" onClick={() => openModal("edit", admin)}>Edit</button>
                            <button className="delete-btn" onClick={() => openModal("delete", admin)}>Delete</button>
                        </div>
                        )}
                    </div>
                    ))}
                    {/* Conditionally Render Delete Modal */}
                    {modalType === "delete" && (
                      <div className="admin-modal-overlay">
                        <div className="modal">
                          <h3>Delete Admin Account</h3>        
                          <p>Are you sure you want to delete {selectedAdmin.id}: {selectedAdmin.username}?</p>
                          <div className="admin-home-message">
                            {loading && <div className="loadingMessage">Loading...</div>}
                            {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                            {successMessage && <p className="successMessage">{successMessage}</p>}
                          </div>
                          <div className="modal-actions">
                            <button type="button" className="cancel-delete-admin-btn" onClick={closeModal}>
                              Cancel
                            </button>
                            <button type="button" className="confirm-delete-admin-btn"  onClick={() => handleDeleteAdmin(selectedAdmin.id)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Conditionally Render Edit Modal */}
                    {modalType === "edit" && (
                      <div className="admin-modal-overlay">
                        <div className="modal">
                          <h3>Edit Admin Account</h3>
                          <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
                            <p>Admin ID: {selectedAdmin.id}</p>
                            <div className="edit-admin-block">
                              {editUsername ? (
                                <>
                                  <label>Username:</label>
                                  <input
                                  type="text"
                                  placeholder="New Username"
                                  required 
                                  value={newUsername} 
                                  onChange={(e) => setNewUsername(e.target.value)} />
                                  <button className="cancel-edit-admin-field-btn" onClick={() => {setEditUsername(false); setNewUsername("");}}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <label>Username:</label>
                                  <span className="current-username">{selectedAdmin.username}</span>
                                  <button className="edit-admin-field-btn" onClick={() => {setEditUsername(true);}}>Edit</button>
                                </>
                              )}
                            </div>
                            <div className="edit-admin-block">
                              {editPassword ? (
                                <>
                                  <label>Password:</label>
                                  <input
                                  type="password"
                                  placeholder="New Password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  />
                                  <button className="cancel-edit-admin-field-btn" onClick={() => {setEditPassword(false); setPassword("");}}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <label>Password:</label>
                                  <span className="hidden-password">******</span> {/* Placeholder password */}
                                  <button className="edit-admin-field-btn" onClick={() => {setEditPassword(true)}}>Edit</button>
                                </>
                              )}
                            </div>
                            <div className="edit-admin-block">
                              {editRole ? (
                                <>
                                  <label>Role:</label>
                                  <select required value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="">Select Role</option>
                                    <option value="true">Head Admin</option>
                                    <option value="false">Regular Admin</option>
                                  </select>
                                  <button className="cancel-edit-admin-field-btn" onClick={() => {setEditRole(false); setRole("");}}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <label>Role:</label>
                                  <span className="hidden-password">
                                    {selectedAdmin.headAdmin ? ("Head Admin") : ("Regular Admin")}
                                  </span>
                                  <button className="edit-admin-field-btn" onClick={() => {setEditRole(true)}}>Edit</button>
                                </>
                              )}
                            </div>
                            <div className="admin-home-message">
                              {loading && <div className="loadingMessage">Loading...</div>}
                              {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                              {successMessage && <p className="successMessage">{successMessage}</p>}
                            </div>
                            <div className="modal-actions">
                              <button type="button" className="cancel-edit-admin-btn" onClick={closeModal}>
                                Cancel
                              </button>
                              <button type="button" className="confirm-edit-admin-btn"  onClick={() => handleEditAdmin()}>
                                Edit
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                    
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