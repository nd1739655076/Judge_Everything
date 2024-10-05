import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import HomePage from './Components/HomePage/HomePage';
import LoginSignup from './Components/LoginSignup/LoginSignup';
import ForgotPassword from './Components/LoginSignup/ForgotPassword';
import Settings from './Components/HomePage/Settings';
import CreatProductEntry from './Components/HomePage/CreatProductEntry';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/loginSignup" element={<LoginSignup />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/creatProductEntry" element={<CreatProductEntry />} />
      </Routes>
    </Router>
  );
}

export default App;
