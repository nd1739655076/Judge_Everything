import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

// HomePage
import HomePage from './Components/HomePage/HomePage';
import ContactPage from './Components/ContactPage/ContactPage';
import History from './Components/HistoryPage/History';
import ProductCreateHistory from './Components/HistoryPage/ProductCreateHistory';
import ReviewHistory from './Components/HistoryPage/ReviewHistory';
import BrowseHistory from './Components/HistoryPage/BrowseHistory';
import MessagePage from './Components/MessagePage/MessagePage';
// Account
import LoginSignup from './Components/LoginSignup/LoginSignup';
import PreferenceSurvey from './Components/PreferenceSurvey/PreferenceSurvey'
import ForgotPassword from './Components/LoginSignup/ForgotPassword';
import AccountSettings from './Components/HomePage/AccountSettings';
// ProductEntry
import CreateProductEntry from './Components/HomePage/CreateProductEntry';
import ProductEntry from './Components/ProductEntry/ProductEntry';
import EditProduct from './Components/ProductEntry/EditProductEntry';
import ProductListing from './Components/HomePage/ProductListing';
// AdminClient
import AdminLogin from './AdminClient/Login/AdminLogin';
import HeadAdminHomePage from './AdminClient/Homepage/HeadAdminHomePage';
// regular admin client
import R_Admin from './AdminClient/Homepage/R_Admin';
import AdminEdit from './AdminClient/Homepage/AdminEdit';
import Notification from './Components/HomePage/Notification';

function App() {
  return (
    <Router>
      <Routes>
        
        {/* HomePage */}
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/create" element={<ProductCreateHistory />} />
        <Route path="/history/review" element={<ReviewHistory />} />
        <Route path="/history/browse" element={<BrowseHistory />} />
        <Route path="/notification/:uid" element={<Notification />} />
        <Route path="/message" element={<MessagePage />} />

        {/* Account */}
        <Route path="/loginSignup" element={<LoginSignup />} />
        <Route path="/preferenceSurvey" element={<PreferenceSurvey />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/accountSettings" element={<AccountSettings />} />

        {/* ProductEntry */}
        <Route path="/createProductEntry" element={<CreateProductEntry />} />
        <Route path="/product/:productId" element={<ProductEntry />} />
        <Route path="/editproduct" element={<EditProduct />} />
        <Route path="/productListing" element={<ProductListing />} />

        {/* AdminClient */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/headadmin/home" element={<HeadAdminHomePage />} />
        <Route path="/admin/regularHome" element={<R_Admin />} />
        <Route path="/admin/edit/:productId" element={<AdminEdit />} />
      </Routes>
    </Router>
  );
}

export default App;