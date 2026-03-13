import React from "react";
import MarketInsightsPage from "../../components/market/MarketInsightsPage";
import styles from "../../pages/guest/GuestDashboard.module.css";

const GuestDashboard = () => {
  return <MarketInsightsPage styles={styles} headerRole="GUEST" />;
};

export default GuestDashboard;
