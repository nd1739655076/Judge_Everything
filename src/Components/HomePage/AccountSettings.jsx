import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import './AccountSettings.css';

import { useNavigate } from 'react-router-dom';
import { FaImage, FaUserAlt, FaLock, FaEnvelope, FaUserTag } from 'react-icons/fa';
import Logo from '../HomePageAssets/logo.jpg';

const AccountSettings = () => {

  const [uid, setUid] = useState('');
  const [profileImage, setProfileImage] = useState(Logo);
  const [profileImageInput, setProfileImageInput] = useState('');
  const [account, setAccount] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nickName, setNickName] = useState('');
  const [nickNameInput, setNickNameInput] = useState('');
  const [preferences, setPreferences] = useState('');
  const [preferencesInput, setPreferencesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [changeField, setChangeField] = useState(null);
  const [ifChange, setIfChange] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordCheckInput, setPasswordCheckInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      try {
        const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
        const loginStatusResponse = await handleUserRequest({
          action: 'checkLoginStatus',
          statusToken: localStatusToken,
        });
        if (loginStatusResponse.data.success) {
          const uidNum = loginStatusResponse.data.uid;
          setUid(uidNum);
          // Get User Data
          const userDataResponse = await handleUserRequest({
            action: 'getUserData',
            uidNum: uidNum,
          });
          if (userDataResponse.data.success) {
            const { profileImage, username, email, nickname,
              password, preferences } = userDataResponse.data.data;
            setProfileImage(profileImage || Logo);
            setAccount(username);
            setPassword(password || '');
            setEmail(email || '');
            setNickName(nickname || '');
            setPreferences(preferences[0] || '');
            setIfChange(false);
            setErrorMessage('');
            setSuccessMessage('');
          } else {
            setErrorMessage(userDataResponse.data.message);
          }
        } else {
          setErrorMessage(loginStatusResponse.data.message);
        }
      } catch (error) {
        setLoading(false);
        setErrorMessage('An error occurred while fetching user data.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setErrorMessage('User not logged in.');
    }
  };
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setChangeField(null);
    setProfileImageInput('');
    setUsernameInput('');
    setPasswordInput('');
    setEmailInput('');
    setNickNameInput('');
    setPreferencesInput('');
    setErrorMessage('');
    setSuccessMessage('');
    fetchUserData();
  };
  const handleChangeClick = (field) => {
    setChangeField(field);
    setErrorMessage('');
    setSuccessMessage('');
  };
  const handleSave = (field) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (field === 'account') {
      if (usernameInput.trim() === '') {
        setErrorMessage('Username cannot be empty.');
        return;
      } else if (usernameInput === account) {
        setErrorMessage('No changes were made to the account.');
        return;
      } else {
        setAccount(usernameInput);
      }
    }
    if (field === 'password') {
      if (passwordInput.trim() === '') {
        setErrorMessage('Password cannot be empty.');
        return;
      } else if (passwordInput === password) {
        setErrorMessage('No changes were made to the password.');
        return;
      } else if (passwordInput.length < 6) {
        setErrorMessage('Password length should be at least 6 characters.');
        return;
      } else {
        setPassword(passwordInput);
      }
    }
    if (field === 'email') {
      if (emailInput.trim() === '') {
        setErrorMessage('Email cannot be empty.');
        return;
      } else if (emailInput === email) {
        setErrorMessage('No changes were made to the email.');
        return;
      } else {
        setEmail(emailInput);
      }
    }
    if (field === 'nickName') {
      if (nickNameInput.trim() === '') {
        setErrorMessage('Nickname cannot be empty.');
        return;
      } else if (nickNameInput === nickName) {
        setErrorMessage('No changes were made to the nickname.');
        return;
      } else {
        setNickName(nickNameInput);
      }
    }
    if (field === 'preferences') {
      if (preferencesInput.trim() === '') {
        setErrorMessage('Preferences cannot be empty.');
        return;
      } else if (preferencesInput === preferences) {
        setErrorMessage('No changes were made to the preferences.');
        return;
      } else {
        setPreferences(preferencesInput);
      }
    }
    setChangeField(null);
    setIfChange(true);
    setSuccessMessage('Changes saved locally. Please click "Update" to make sure you wanna update your account.');
  };
  const handleCancel = () => {
    setIfChange(false);
    setErrorMessage('');
    setSuccessMessage('');
    if (changeField === 'account') {
      setUsernameInput('');
    } else if (changeField === 'password') {
      setPasswordInput('');
    } else if (changeField === 'email') {
      setEmailInput('');
    } else if (changeField === 'nickName') {
      setNickNameInput('');
    } else if (changeField === 'preferences') {
      setPreferencesInput('');
    }
    setChangeField(null);
  };
  const handleUpdateAll = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!ifChange) {
      setErrorMessage('No changes detected. Please make some changes before updating.');
      return;
    }
    setLoading(true);
    const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
    const response = await handleUserRequest({
      action: 'accountSetting',
      uidNum: uid,
      username: usernameInput || account,
      password: passwordInput || password,
      email: emailInput || email,
      nickname: nickNameInput || nickName,
      preferences: preferencesInput || preferences
    });
    setLoading(false);
    if (response.data.success) {
      //fetchUserData();
      setIsEditing(false);
      setErrorMessage('');
      setSuccessMessage('Account updated successfully!');
    } else {
      setErrorMessage(response.data.message);
    }
    setChangeField(null);
  };
  const handlePasswordClick = () => {
    setShowPasswordModal(true);
    setPasswordCheckInput('');
    setPasswordError('');
  };
  const handleConfirmPassword = () => {
    if (passwordCheckInput === password) {
      setShowPasswordModal(false);
      setIsEditing(true);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };
  const handleCancelPassword = () => {
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordCheckInput('');
  };
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteError('');
    setDeleteInput('');
  };
  const handleConfirmDelete = async () => {
    if (deleteInput.trim() === `DELETE ${account}`) {
      setShowDeleteModal(false);
      setDeleteError('');
      setDeleteInput('');
      setLoading(true);
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      const response = await handleUserRequest({
        action: 'delete',
        uidNum: uid,
      });
      setLoading(false);
      if (response.data.success) {
        setSuccessMessage('Account deleted successfully. Redirecting...');
        localStorage.removeItem('authToken');
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else {
        setDeleteError(response.data.message);
      }
    } else {
      setDeleteError(`Please enter "DELETE ${account}" to confirm.`);
    }
  };
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteError('');
    setDeleteInput('');
  };

  return (
    <div className="accountSettings">

      <img src={Logo} alt="LogoPicture" className="logoPicture" />

      <header className="accountSettingsHeader">
        <h1>Account Settings</h1>
        <p>Manage your account details below</p>
      </header>

      <form>
        <div className="accountSettingsFormGroup">
          {/* add image here with same style */}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="account">
            <FaUserAlt /> Account
          </label>
          <input
            type="text"
            id="account"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder={account}
            disabled={!isEditing || changeField !== 'account'}
            className={changeField === 'account' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {isEditing && (
            changeField === 'account' ? (
              <>
                <button type="button" onClick={() => handleSave('account')}>Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleChangeClick('account')}
                disabled={changeField !== null}
                className={changeField !== null ? 'disabled-button' : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="password">
            <FaLock /> Password
          </label>
          <input
            type="password"
            id="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="••••••••"
            disabled={!isEditing || changeField !== 'password'}
            className={changeField === 'password' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {isEditing && (
            changeField === 'password' ? (
              <>
                <button type="button" onClick={() => handleSave('password')}>Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleChangeClick('password')}
                disabled={changeField !== null}
                className={changeField !== null ? 'disabled-button' : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="email">
            <FaEnvelope /> Email
          </label>
          <input
            type="email"
            id="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={email || 'The user is so lazy and leaves nothing here'}
            disabled={!isEditing || changeField !== 'email'}
            className={changeField === 'email' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {isEditing && (
            changeField === 'email' ? (
              <>
                <button type="button" onClick={() => handleSave('email')}>Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleChangeClick('email')}
                disabled={changeField !== null}
                className={changeField !== null ? 'disabled-button' : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="nickName">
            <FaUserTag /> Nick Name
          </label>
          <input
            type="text"
            id="nickName"
            value={nickNameInput}
            onChange={(e) => setNickNameInput(e.target.value)}
            placeholder={nickName || 'The user is so lazy and leaves nothing here'}
            disabled={!isEditing || changeField !== 'nickName'}
            className={changeField === 'nickName' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {isEditing && (
            changeField === 'nickName' ? (
              <>
                <button type="button" onClick={() => handleSave('nickName')}>Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleChangeClick('nickName')}
                disabled={changeField !== null}
                className={changeField !== null ? 'disabled-button' : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className="accountSettingsFormGroup">
        <label htmlFor="preferences">
            <FaUserTag /> Preferences
          </label>
          <input
            type="text"
            id="preferences"
            value={preferencesInput}
            onChange={(e) => setPreferencesInput(e.target.value)}
            placeholder={preferences || 'The user is so lazy and leaves nothing here'}
            disabled={!isEditing || changeField !== 'preferences'}
            className={changeField === 'preferences' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {isEditing && (
            changeField === 'preferences' ? (
              <>
                <button type="button" onClick={() => handleSave('preferences')}>Save</button>
                <button type="button" onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleChangeClick('preferences')}
                disabled={changeField !== null}
                className={changeField !== null ? 'disabled-button' : ''}
              >
                Change
              </button>
            )
          )}
        </div>
      </form>

      <div className="message">
        {loading && <div className="loadingMessage">Loading...</div>}
        {errorMessage && <p className="errorMessage">{errorMessage}</p>}
        {successMessage && <p className="successMessage">{successMessage}</p>}
      </div>

      <div className="buttonContainer" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        {isEditing ? (
          <>
            <button onClick={handleUpdateAll}>Update</button>
            <button onClick={handleDeleteClick}>Delete</button>
            <button onClick={handleEditToggle}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={handlePasswordClick}>Edit</button>
            <button onClick={() => navigate('/')}>Back to HomePage</button>
          </>
        )}
      </div>

      {showPasswordModal && (
        <div className="passwordModal">
          <div className="passwordModalContent">
            <h3 className="passwordModalHeader">Enter Your Password</h3>
            <input
              type="password"
              value={passwordCheckInput}
              onChange={(e) => setPasswordCheckInput(e.target.value)}
              placeholder="Enter your password"
            />
            {passwordError && <p className="passwordErrorMessage">{passwordError}</p>}
            <div className="passwordModalButtons">
              <button onClick={handleConfirmPassword}>Confirm</button>
              <button onClick={handleCancelPassword}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="deleteModal">
          <div className="deleteModalContent">
            <h3 className="deleteModalHeader">Confirm Account Deletion</h3>
            <p>Type "DELETE {account}" to confirm deletion:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={`DELETE ${account}`}
            />
            {deleteError && <p className="deleteErrorMessage">{deleteError}</p>}
            <div className="deleteModalButtons">
              <button onClick={handleConfirmDelete}>Confirm Delete</button>
              <button onClick={handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
  
};

export default AccountSettings;