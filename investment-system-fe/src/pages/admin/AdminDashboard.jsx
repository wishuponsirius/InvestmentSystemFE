import React, { useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "../../pages/admin/AdminDashboard.module.css";

const AdminDashboard = () => {
  const [role] = useState("admin");

  return (
    <div className={styles.pageWrapper}>
      <Header role={role} />

      <main className={styles.mainContent}>
        {/* Section 1: Health */}
        <section>
          <h2 className={styles.sectionTitle}>System Health Overview</h2>
          <div className={styles.healthGrid}>
            <HealthCard
              title="Java Backend Core"
              desc="Operational and stable, processing all requests efficiently."
            />
            <HealthCard
              title="Python Data Crawler"
              desc="Actively fetching real-time market data without interruptions."
            />
            <HealthCard
              title="Database Connection"
              desc="Secure and consistent connectivity, ensuring data integrity."
            />
          </div>
        </section>

        {/* Section 2: Management Table */}
        <section>
          <h2 className={styles.sectionTitle}>Data Source Management</h2>
          <div className={styles.tableContainer}>
            <table className={styles.managementTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th className="px-6 py-4">Source Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Last Sync</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <TableRow
                  name="SJC"
                  type="Market Price Feed"
                  desc="Local gold market..."
                  sync="2 mins ago"
                  active
                />
                <TableRow
                  name="Kitco"
                  type="Global Price Feed"
                  desc="International metals..."
                  sync="1 hour ago"
                  active
                />
                <TableRow
                  name="PNJ"
                  type="Market Price Feed"
                  desc="Local jewelry..."
                  sync="10 mins ago"
                />
                <TableRow
                  name="LBMA"
                  type="Global Price Feed"
                  desc="London Bullion..."
                  sync="30 mins ago"
                  active
                />
                <TableRow
                  name="CFTC"
                  type="Regulatory Data"
                  desc="Commodity Futures..."
                  sync="6 hours ago"
                />
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Crawler Status */}
        <section>
          <h2 className={styles.sectionTitle}>Crawler Status Overview</h2>
          <div className={styles.crawlerGrid}>
            <CrawlerCard
              name="SJC Scraper"
              lastRun="12s ago"
              success="99.8%"
              fetched="2.5M"
              price="85,000,000"
            />
            <CrawlerCard
              name="PNJ Scraper"
              lastRun="2m ago"
              success="99.9%"
              fetched="1.8M"
              price="78,500,000"
            />
            <CrawlerCard
              name="Kitco API"
              lastRun="1h ago"
              success="95.1%"
              fetched="5.1M"
              price="1,980.20 USD"
              isHot
            />
            <CrawlerCard
              name="Forex API"
              lastRun="30s ago"
              success="100%"
              fetched="12.3M"
              price="1.0850 EUR/USD"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// --- Sub-components (Dùng nội bộ cho gọn) ---

const HealthCard = ({ title, desc }) => (
  <div className={styles.healthCard}>
    <h3 className="font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
  </div>
);

const TableRow = ({ name, type, desc, sync, active }) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4 font-bold text-gray-800">{name}</td>
    <td className="px-6 py-4 text-[11px] font-medium text-gray-400">{type}</td>
    <td className="px-6 py-4 text-[11px] text-gray-400 max-w-xs truncate">
      {desc}
    </td>
    <td className="px-6 py-4 text-[11px] text-gray-400">{sync}</td>
    <td className="px-6 py-4">
      <div
        className={`${styles.toggleBg} ${active ? "bg-[#FFDA91]" : "bg-gray-200"}`}
      >
        <div
          className={`${styles.toggleCircle} ${active ? "right-1" : "left-1"}`}
        />
      </div>
    </td>
  </tr>
);

const CrawlerCard = ({ name, lastRun, success, price, isHot }) => (
  <div className={styles.crawlerCard}>
    <div className="flex justify-between items-start mb-4">
      <h4 className="font-bold text-gray-800 text-sm">{name}</h4>
      {isHot && <div className={styles.statusDot} />}
    </div>
    <div className="space-y-1.5 mb-6">
      <p className="text-[10px] text-gray-400 italic">
        Last Run:{" "}
        <span className="text-gray-600 not-italic font-medium">{lastRun}</span>
      </p>
      <p className="text-[10px] text-gray-400 italic">
        Success:{" "}
        <span className="text-gray-600 not-italic font-medium">{success}</span>
      </p>
      <p className="text-[10px] text-gray-400 italic">
        Latest:{" "}
        <span className="text-gray-600 not-italic font-medium">{price}</span>
      </p>
    </div>
    <div className="flex gap-2">
      <button className={styles.primaryBtn}>Trigger</button>
      <button className={styles.secondaryBtn}>Logs</button>
    </div>
  </div>
);

export default AdminDashboard;
