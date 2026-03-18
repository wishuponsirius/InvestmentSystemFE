import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "./Analytics.module.css";

const Analytics = () => {
  return (
    <div className={styles.pageWrapper}>
      <Header role="INVESTOR" />
      <main className={styles.container}>
        <h1 className={styles.pageTitle}>Market Analytics</h1>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;
