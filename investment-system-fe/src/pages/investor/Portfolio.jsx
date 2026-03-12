import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "./Portfolio.module.css";

const Portfolio = () => {
  const holdings = [
    {
      name: "SJC Gold Bar",
      type: "1 oz",
      quantity: "5.00 oz",
      avgCost: "$1850.00",
      marketValue: "$2050.00",
      pnl: "+$1000.00",
      positive: true,
    },
    {
      name: "PNJ Silver Bar",
      type: "100 g",
      quantity: "1000.00 oz",
      avgCost: "$25.00",
      marketValue: "$28.00",
      pnl: "+$3000.00",
      positive: true,
    },
    {
      name: "ABC Platinum Coin",
      type: "0.5 oz",
      quantity: "2.00 oz",
      avgCost: "$950.00",
      marketValue: "$900.00",
      pnl: "-$100.00",
      positive: false,
    },
    {
      name: "XYZ Gold Nugget",
      type: "Raw Form",
      quantity: "0.75 oz",
      avgCost: "$1900.00",
      marketValue: "$2100.00",
      pnl: "+$150.00",
      positive: true,
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <Header role="INVESTOR" />

      <main className={styles.container}>
        {/* ===== Summary ===== */}
        <h1 className={styles.pageTitle}>Portfolio Summary</h1>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.label}>Total Wealth</span>
            <h2 className={styles.value}>$250,000.00</h2>
          </div>

          <div className={styles.summaryCard}>
            <span className={styles.label}>Total Profit / Loss</span>
            <h2 className={`${styles.value} ${styles.positive}`}>
              +$28,500.00
            </h2>
            <span className={styles.subValue}>+12.87%</span>
          </div>
        </div>

        {/* ===== Holdings ===== */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Holdings</h2>
            <button className={styles.addBtn}>+ Record New Transaction</button>
          </div>

          <div className={styles.holdingsList}>
            {holdings.map((item, index) => (
              <div key={index} className={styles.holdingCard}>
                <div>
                  <h3 className={styles.assetName}>{item.name}</h3>
                  <span className={styles.assetType}>{item.type}</span>
                </div>

                <div className={styles.assetStats}>
                  <div>
                    <span className={styles.statLabel}>Quantity</span>
                    <p>{item.quantity}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Avg. Cost</span>
                    <p>{item.avgCost}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Market Value</span>
                    <p>{item.marketValue}</p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Net Profit</span>
                    <p
                      className={
                        item.positive ? styles.pnlPositive : styles.pnlNegative
                      }
                    >
                      {item.pnl}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Portfolio;