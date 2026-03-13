import React from "react";
import MarketInsightsPage from "../../components/market/MarketInsightsPage";
import styles from "../../pages/investor/InvestorDashboard.module.css";

const InvestorDashboard = () => {
  return <MarketInsightsPage styles={styles} headerRole="INSTITUTION" />;
};

export default InvestorDashboard;
