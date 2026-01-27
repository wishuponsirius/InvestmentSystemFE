import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import GuestDashboard from "../../src/pages/guest/GuestDashboard.jsx";
import LoginPage from "../../src/pages/authentication/LoginPage.jsx";
import AdminDashboard from "../../src/pages/admin/AdminDashboard.jsx";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/guest-dashboard" />} />
        <Route path="/guest-dashboard" element={<GuestDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
