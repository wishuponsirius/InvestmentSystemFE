import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import GuestDashboard from "../../src/pages/guest/GuestDashboard.jsx";
import LoginPage from "../../src/pages/authentication/LoginPage.jsx";
import RegisterPage from "../../src/pages/authentication/RegisterPage.jsx";
import AdminDashboard from "../../src/pages/admin/AdminDashboard.jsx";
import InvestorDashboard from "../pages/investor/InvestorDashboard.jsx";
import UserManagement from "../../src/pages/admin/UserManagement.jsx";
import Portfolio from "../pages/investor/Portfolio.jsx";
import Analytics from "../pages/investor/Analytics.jsx";
import News from "../pages/investor/News.jsx";
import UserProfile from "../../src/components/user-profile/UserProfile.jsx";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/guest-dashboard" />} />
        <Route path="/guest-dashboard" element={<GuestDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/investor-dashboard" element={<InvestorDashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/news" element={<News />} />
        <Route path="/user-profile" element={<UserProfile />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
