import './App.css';
import { Routes, Route } from 'react-router-dom'; 
import LoginSignup from './Components/LoginSignup/LoginSignup';
import HomePage from './Components/HomePage/HomePage';
import ForgotPassword from './Components/ForgotPassword/ForgotPassword'; 

function App() {
  return (
    <div>
      <Routes>
        {/* Route for the root ("/") to load HomePage */}
        <Route path="/" element={<HomePage />} />

        {/* Route for Login/Signup page */}
        <Route path="/login-signup" element={<LoginSignup />} />

        {/* Route for Forgot Password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Route for HomePage */}
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </div>
  );
}

export default App;