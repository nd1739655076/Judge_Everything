import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import HomePage from './Components/HomePage/HomePage';
import ContactPage from './Components/ContactPage/ContactPage';
import LoginSignup from './Components/LoginSignup/LoginSignup';
import ForgotPassword from './Components/LoginSignup/ForgotPassword';
import Settings from './Components/HomePage/AccountSetting';
//import CreatProductEntry from './Components/HomePage/CreatProductEntry';
//<Route path="/creatProductEntry" element={<CreatProductEntry />} />

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/loginSignup" element={<LoginSignup />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/accountSetting" element={<Settings />} />
        
      </Routes>
    </Router>
  );
}

export default App;
