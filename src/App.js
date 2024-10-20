import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import HomePage from './Components/HomePage/HomePage';
import ContactPage from './Components/ContactPage/ContactPage';
import LoginSignup from './Components/LoginSignup/LoginSignup';
import PreferenceSurvey from './Components/PreferenceSurvey/PreferenceSurvey'
import ForgotPassword from './Components/LoginSignup/ForgotPassword';
import AccountSettings from './Components/HomePage/AccountSettings';
import CreateProductEntry from './Components/HomePage/CreateProductEntry';
import ProductEntry from './Components/ProductEntry/ProductEntry';
import EditProduct from './Components/ProductEntry/EditProductEntry'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/loginSignup" element={<LoginSignup />} />
        <Route path="/preferenceSurvey" element={<PreferenceSurvey />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/accountSettings" element={<AccountSettings />} />
        <Route path="/createProductEntry" element={<CreateProductEntry />} />
        <Route path="/product/:productId" element={<ProductEntry />} /> {/* Dynamic route for product details */}
        <Route path="/editproduct" element={<EditProduct />} />

      </Routes>
    </Router>
  );
}

export default App;