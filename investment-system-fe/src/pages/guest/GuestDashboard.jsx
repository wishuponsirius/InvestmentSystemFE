import React from "react";
import MarketInsightsPage from "../../components/market/MarketInsightsPage";
import styles from "../../pages/guest/GuestDashboard.module.css";
import VirtualPet from "../../assets/virtual-pet/VirtualPet";
const GuestDashboard = () => {
  return (
    <div>
      <MarketInsightsPage styles={styles} headerRole="GUEST" />
      <VirtualPet />
    </div>
  );
};

export default GuestDashboard;
