import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "./Analytics.module.css";

const Analytics = () => {
  return (
    <div className={styles.pageWrapper}>
      <Header role="INVESTOR" />

      <main className={styles.container}>
        {/* ===== Page Title ===== */}
        <h1 className={styles.pageTitle}>Advanced Analytics</h1>

        {/* ===== GSR Chart ===== */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Gold / Silver Ratio Analysis</h3>
          <div className={styles.chartBox}>
            <span className={styles.chartPlaceholder}>
              Line Chart: Gold vs Silver Price (USD/oz)
            </span>
          </div>
        </section>

        {/* ===== Middle Grid ===== */}
        <div className={styles.gridTwoCols}>
          {/* Correlation */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Correlation: Metal Price vs USD Rate
            </h3>
            <div className={styles.chartBox}>
              <span className={styles.chartPlaceholder}>
                Dual Line Chart (Metal vs DXY)
              </span>
            </div>
          </section>

          {/* Seasonality */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Seasonality: Average Monthly Returns
            </h3>
            <div className={styles.chartBox}>
              <span className={styles.chartPlaceholder}>
                Bar Chart: Monthly Returns
              </span>
            </div>
          </section>
        </div>

        {/* ===== Simulation ===== */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Investment Simulation</h3>

          <div className={styles.simulationGrid}>
            <div className={styles.formGroup}>
              <label>Quantity</label>
              <input type="number" placeholder="100" />
            </div>

            <div className={styles.formGroup}>
              <label>Metal Type</label>
              <select>
                <option>Gold</option>
                <option>Silver</option>
                <option>Platinum</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Purchase Date</label>
              <input type="date" />
            </div>

            <button className={styles.runBtn}>Run Simulation</button>
          </div>

          <div className={styles.simulationResult}>
            <p>
              If you bought <b>100 units of Gold</b> on <b>2023-01-01</b>, you
              would have an estimated:
            </p>
            <h2 className={styles.profit}>$2,500.00 Profit</h2>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
