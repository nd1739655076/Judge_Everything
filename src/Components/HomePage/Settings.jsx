import React, { useState } from 'react';
//import './Settings.css';

const Settings = () => {

  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');

  const handleAccountNameChange = (e) => {
    setAccountName(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleDeleteAccount = () => {
    alert("Are you sure you want to delete your account?");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Account updated:\nAccount Name: ${accountName}\nPassword: [Hidden]`);
  };

  return (
    <div className="settings-container">
      <h2>Account Settings</h2>
      
      {/* Form for changing account name and password */}
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="accountName">Account Name</label>
          <input
            type="text"
            id="accountName"
            value={accountName}
            onChange={handleAccountNameChange}
            placeholder="Enter new account name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter new password"
            required
          />
        </div>
        
        <button type="submit" className="save-button">Save Changes</button>
      </form>

      <button onClick={handleDeleteAccount} className="delete-button">Delete Account</button>
    </div>
  );
};

export default Settings;
