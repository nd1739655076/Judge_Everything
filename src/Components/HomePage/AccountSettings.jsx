import React, { useState } from 'react';
import './AccountSettings.css';

import { FaUserAlt, FaLock, FaEnvelope, FaUserTag } from 'react-icons/fa';
import Logo from '../HomePageAssets/logo.jpg';

const AccountSettings = () => {

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickName, setNickName] = useState('');

  const [editField, setEditField] = useState(null);
  const handleEditClick = (field) => {
    setEditField(field);
  };
  const handleSave = (field) => {
    setEditField(null);
  };
  const handleCancel = () => {
    setEditField(null);
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
          <label htmlFor="account">
            <FaUserAlt /> Account
          </label>
          <input
            type="text"
            id="account"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="???"
            disabled={editField !== 'account'}
            className={editField === 'account' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {editField === 'account' ? (
            <>
              <button type="button" onClick={() => handleSave('account')}>Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleEditClick('account')}
              disabled={editField !== null}
              className={editField !== null ? 'disabled-button' : ''}
            >
              Change
            </button>
          )}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="password">
            <FaLock /> Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="???"
            disabled={editField !== 'password'}
            className={editField === 'password' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {editField === 'password' ? (
            <>
              <button type="button" onClick={() => handleSave('password')}>Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleEditClick('password')}
              disabled={editField !== null}
              className={editField !== null ? 'disabled-button' : ''}
            >
              Change
            </button>
          )}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="email">
            <FaEnvelope /> Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="???"
            disabled={editField !== 'email'}
            className={editField === 'email' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {editField === 'email' ? (
            <>
              <button type="button" onClick={() => handleSave('email')}>Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleEditClick('email')}
              disabled={editField !== null}
              className={editField !== null ? 'disabled-button' : ''}
            >
              Change
            </button>
          )}
        </div>

        <div className="accountSettingsFormGroup">
          <label htmlFor="nickName">
            <FaUserTag /> Nick Name
          </label>
          <input
            type="text"
            id="nickName"
            value={nickName}
            onChange={(e) => setNickName(e.target.value)}
            placeholder="???"
            disabled={editField !== 'nickName'}
            className={editField === 'nickName' ? 'placeholder-editable' : 'placeholder-locked'}
          />
          {editField === 'nickName' ? (
            <>
              <button type="button" onClick={() => handleSave('nickName')}>Save</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleEditClick('nickName')}
              disabled={editField !== null}
              className={editField !== null ? 'disabled-button' : ''}
            >
              Change
            </button>
          )}
        </div>
      </form>

    </div>
  );
  
};

export default AccountSettings;