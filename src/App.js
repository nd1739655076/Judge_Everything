import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { FollowModalProvider } from './Components/FollowModal/FollowModal';

// HomePage
import HomePage from './Components/HomePage/HomePage';
import ContactPage from './Components/ContactPage/ContactPage';
import MessagePage from './Components/MessagePage/MessagePage';
// History
import History from './Components/HistoryPage/History';
import ProductCreateHistory from './Components/HistoryPage/ProductCreateHistory';
import ReviewHistory from './Components/HistoryPage/ReviewHistory';
import BrowseHistory from './Components/HistoryPage/BrowseHistory';
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
// Admin Client
import AdminLogin from './AdminClient/Login/AdminLogin';
import HeadAdminHomePage from './AdminClient/Homepage/HeadAdminHomePage';

function App() {
  return (
    <FollowModalProvider>
      <Router>
        <Routes>
        
          {/* HomePage */}
          <Route path="/" element={<HomePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/message" element={<MessagePage />} />

          {/* History */}
          <Route path="/history" element={<History />} />
          <Route path="/history/create" element={<ProductCreateHistory />} />
          <Route path="/history/review" element={<ReviewHistory />} />
          <Route path="/history/browse" element={<BrowseHistory />} />

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

          {/* Admin Client */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/headadmin/home" element={<HeadAdminHomePage />} />
          {/* <Route path="/admin/home" element={<AdminHomePage />} /> */}

        </Routes>
      </Router>
    </FollowModalProvider>
  );
}

export default App;