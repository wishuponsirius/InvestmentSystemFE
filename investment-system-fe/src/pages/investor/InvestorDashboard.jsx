import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "../../pages/investor/InvestorDashboard.module.css";

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("GOLD");

  const priceData = [
    {
      provider: "SJC",
      type: "Gold Bars",
      buy: "68,000,000",
      sell: "69,000,000",
      spread: "1,000,000",
    },
    {
      provider: "PNJ",
      type: "Rings",
      buy: "67,800,000",
      sell: "68,800,000",
      spread: "1,000,000",
      bestBuy: true,
    },
    {
      provider: "DOJI",
      type: "Coins",
      buy: "68,500,000",
      sell: "69,200,000",
      spread: "700,000",
      bestSell: true,
    },
    {
      provider: "BTMC",
      type: "Jewelry",
      buy: "67,900,000",
      sell: "68,900,000",
      spread: "1,000,000",
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Header luôn trải dài nhưng nội dung bên trong sẽ được căn giữa */}
      <Header role="INVESTOR" />

      {/* 2. Phần nội dung chính */}
      <main className={styles.dashboardContainer}>
        {/* Tab Navigation */}
        <div className={styles.tabContainer}>
          {["GOLD", "SILVER", "PLATINUM"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.cardLabel}>Domestic Price</span>
            <h2 className={styles.mainPrice}>
              68,500,000 VND <small>/ Ounce</small>
            </h2>
            <div className={styles.priceSub}>
              <span>Buy: 69,500,000 VND</span>
            </div>
            <span className={styles.trendDown}>Sell Price Today ↘ -0.5%</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.cardLabel}>World Price</span>
            <h2 className={styles.mainPrice}>
              2,350.00 USD <small>/ Ounce</small>
            </h2>
            <div className={styles.priceSub}>
              <span>Approx: 69,000,000 VND</span>
            </div>
            <span className={styles.trendUp}>Converted from USD ↗ +0.3%</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>SPREAD GAP</span>
              <span className={styles.badgeHighRisk}>High Risk</span>
            </div>
            <h2 className={styles.mainPrice}>
              1,000,000 VND <small>/ Ounce</small>
            </h2>
            <p className={styles.riskDesc}>
              Higher than average, potential risk
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className={styles.sectionContainer}>
          <h3 className={styles.sectionTitle}>
            Price Trend: Domestic vs. World
          </h3>
          <div className={styles.chartPlaceholder}>
            <p className="text-gray-400 italic">
              Chart Visualization Component will be here
            </p>
          </div>
        </div>

        {/* Brand Table */}
        <div className={styles.sectionContainer}>
          <h3 className={styles.sectionTitle}>Brand Comparison Table</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Product Type</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Spread</th>
                </tr>
              </thead>
              <tbody>
                {priceData.map((item, index) => (
                  <tr key={index}>
                    <td className="font-bold">{item.provider}</td>
                    <td>{item.type}</td>
                    <td>
                      {item.buy} VND
                      {item.bestSell && (
                        <span className={styles.bestTagSell}>Best Sell</span>
                      )}
                    </td>
                    <td>
                      {item.sell} VND
                      {item.bestBuy && (
                        <span className={styles.bestTagBuy}>Best Buy</span>
                      )}
                    </td>
                    <td>{item.spread} VND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>
            Unlock Advanced Insights & Portfolio Tracking
          </h2>
          <p className={styles.ctaDesc}>
            Track your precious metals portfolio, simulate investments, and get
            personalized analytics.
          </p>
          <button className={styles.ctaBtn} onClick={() => navigate("/login")}>
            Login or Register to Get Started
          </button>
        </div>
      </main>

      {/* 3. Footer tương tự Header */}
      <Footer />
    </div>
  );
};

export default InvestorDashboard;
