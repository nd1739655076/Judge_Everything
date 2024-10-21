import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import styles from './AccountSettings.module.css';

import { useNavigate } from 'react-router-dom';
import { FaImage, FaUserAlt, FaLock, FaEnvelope, FaUserTag } from 'react-icons/fa';
import Logo from '../HomePageAssets/logo.jpg';

const AccountSettings = () => {

  const [availableTags, setAvailableTags] = useState([]);
  const [uid, setUid] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [profileImageInput, setProfileImageInput] = useState('');
  const [account, setAccount] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nickName, setNickName] = useState('');
  const [nickNameInput, setNickNameInput] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [preferencesInput, setPreferencesInput] = useState([]);
  const [showTagLibraryModal, setShowTagLibraryModal] = useState(false);
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
    const fetchTagLibrary = async () => {
      const handleTagRequest = httpsCallable(functions, 'handleTagLibraryRequest');
      const response = await handleTagRequest({ action: 'getTagLibrary' });
      if (response.data.success) {
        setAvailableTags(response.data.tagList);
      }
    };

    fetchTagLibrary();
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
          console.log('User data:', userDataResponse);
          if (userDataResponse.data.success) {
            const { profileImage, username, email, nickname,
              password, preferences } = userDataResponse.data.data;
            setProfileImage(profileImage || Logo);
            console.log('Profile image from database:', profileImage);
            setAccount(username);
            setPassword(password || '');
            setEmail(email || '');
            setNickName(nickname || '');
            setPreferences(preferences || []);
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
    setPreferencesInput([]);
    setErrorMessage('');
    setSuccessMessage('');
    fetchUserData();
  };
  const handleChangeClick = (field) => {
    setChangeField(field);
    if (field === 'preferences') {
      setPreferencesInput(preferences);
      setShowTagLibraryModal(true);
    }
    setErrorMessage('');
    setSuccessMessage('');
  };
  const handleProfileImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImageInput(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleTagSelection = (tagName) => {
    if (preferencesInput.includes(tagName)) {
      setPreferencesInput(preferencesInput.filter((tag) => tag !== tagName));
    } else if (preferencesInput.length < 5) {
      setPreferencesInput([...preferencesInput, tagName]);
    }
  };
  const handleSave = (field) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (field === 'profileImage') {
      if (!profileImageInput) {
        setErrorMessage('No image selected.');
        return;
      } else {
        setProfileImage(profileImageInput);
      }
    }
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
      if (preferencesInput.length === 0) {
        setErrorMessage('Preferences cannot be empty.');
        return;
      } else if (preferencesInput.join(', ') === preferences.join(', ')) {
        setErrorMessage('No changes were made to the preferences.');
        return;
      } else {
        setPreferences(preferencesInput);
        setShowTagLibraryModal(false);
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
    if (changeField === 'profileImage') {
      setProfileImageInput('');
    } else if (changeField === 'account') {
      setUsernameInput('');
    } else if (changeField === 'password') {
      setPasswordInput('');
    } else if (changeField === 'email') {
      setEmailInput('');
    } else if (changeField === 'nickName') {
      setNickNameInput('');
    } else if (changeField === 'preferences') {
      setPreferencesInput([]);
      setShowTagLibraryModal(false);
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
    const handleImageRequest = httpsCallable(functions, 'handleImageRequest');
    await handleImageRequest({
      action: 'upload',
      base64: profileImage.split(',')[1],
      filename: `profile_${uid}.jpg`,
      userId: uid,
    });
    const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
    const response = await handleUserRequest({
      action: 'accountSetting',
      uidNum: uid,
      username: account,
      password: password,
      email: email,
      nickname: nickName,
      preferences: preferences,
    });
    setLoading(false);
    if (response.data.success) {
      fetchUserData();
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
    <div className={styles.accountSettings}>

      <img src={Logo} alt="LogoPicture" className={styles.logoPicture} />

      <header className={styles.accountSettingsHeader}>
        <h1>Account Settings</h1>
        <p>Manage your account details below</p>
      </header>

      <form>
        <div className={`${styles.accountSettingsFormGroup} ${!isEditing ? styles.centeredImage : ''}`}>
          <div className={styles.profileImageContainer}>
            <label htmlFor="profileImage">
              <FaImage /> Profile Image
            </label>
            <img src={profileImage} alt="Profile" className={styles.profileImagePreview} />
          </div>
          {isEditing && (
            <>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={(e) => handleProfileImageUpload(e)}
                disabled={!isEditing || changeField !== 'profileImage'}
                className={changeField === 'profileImage' ? styles.placeholderEditable : styles.placeholderLocked}
              />
              {changeField === 'profileImage' ? (
                <>
                  <button type="button" onClick={() => handleSave('profileImage')}>Save</button>
                  <button type="button" onClick={handleCancel}>Cancel</button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleChangeClick('profileImage')}
                  disabled={changeField !== null}
                  className={changeField !== null ? styles.disabledButton : ''}
                >
                  Change
                </button>
              )}
            </>
          )}
        </div>

        <div className={styles.accountSettingsFormGroup}>
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
            className={changeField === 'account' ? styles.placeholderEditable : styles.placeholderLocked}
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
                className={changeField !== null ? styles.disabledButton : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className={styles.accountSettingsFormGroup}>
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
            className={changeField === 'password' ? styles.placeholderEditable : styles.placeholderLocked}
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
                className={changeField !== null ? styles.disabledButton : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className={styles.accountSettingsFormGroup}>
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
            className={changeField === 'email' ? styles.placeholderEditable : styles.placeholderLocked}
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
                className={changeField !== null ? styles.disabledButton : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className={styles.accountSettingsFormGroup}>
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
            className={changeField === 'nickName' ? styles.placeholderEditable : styles.placeholderLocked}
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
                className={changeField !== null ? styles.disabledButton : ''}
              >
                Change
              </button>
            )
          )}
        </div>

        <div className={styles.accountSettingsFormGroup}>
          <label htmlFor="preferences">
            <FaUserTag /> Preferences
          </label>
          <div className={styles.selectedTagsContainer}>
            {preferences.length > 0 ? (
              preferences.map((tag, index) => (
                <span key={index} className={styles.selectedTag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className={styles.noPreferences}>The user is so lazy and leaves nothing here</span>
            )}
          </div>
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
                className={changeField !== null ? styles.disabledButton : ''}
              >
                Change
              </button>
            )
          )}
        </div>
      </form>

      <div className={styles.message}>
        {loading && <div className={styles.loadingMessage}>Loading...</div>}
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
      </div>

      <div className={styles.buttonContainer} style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
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

      {showTagLibraryModal && (
        <div className={styles.showTagLibraryModal}>
          <div className={styles.showTagLibraryModalContent}>
            <h2>Select up to 5 Preferences</h2>
            <div className={styles.tagButtons}>
              {availableTags.length > 0 ? (
                availableTags.map((tag, index) => (
                  <button
                    key={index}
                    className={`${styles.tagButton} ${preferencesInput.includes(tag.tagName) ? styles.selected : ''}`}
                    onClick={() => handleTagSelection(tag.tagName)}
                  >
                    {tag.tagName}
                  </button>
                ))
              ) : (
                <p>Loading tags...</p>
              )}
            </div>
            <p>You have selected {preferencesInput.length} tags.</p>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className={styles.passwordModal}>
          <div className={styles.passwordModalContent}>
            <h3 className={styles.passwordModalHeader}>Enter Your Password</h3>
            <input
              type="password"
              value={passwordCheckInput}
              onChange={(e) => setPasswordCheckInput(e.target.value)}
              placeholder="Enter your password"
            />
            {passwordError && <p className={styles.passwordErrorMessage}>{passwordError}</p>}
            <div className={styles.passwordModalButtons}>
              <button onClick={handleConfirmPassword}>Confirm</button>
              <button onClick={handleCancelPassword}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.deleteModal}>
          <div className={styles.deleteModalContent}>
            <h3 className={styles.deleteModalHeader}>Confirm Account Deletion</h3>
            <p>Type "DELETE {account}" to confirm deletion:</p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={`DELETE ${account}`}
            />
            {deleteError && <p className={styles.deleteErrorMessage}>{deleteError}</p>}
            <div className={styles.deleteModalButtons}>
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