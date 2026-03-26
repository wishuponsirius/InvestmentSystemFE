import React, { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import MarketPredictionCard from "../../components/market/MarketPredictionCard";
import styles from "./Analytics.module.css";

// Fetch helper — catches CORS and network errors gracefully
const fetchPrediction = async (asset) => {
  const res = await fetch(`http://localhost:8002/prediction/${asset}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    // No credentials/cookies needed for a local dev API
    mode: "cors",
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return res.json();
};

const ASSETS = ["GOLD", "SILVER"];

const Analytics = () => {
  const [predictions, setPredictions] = useState({
    GOLD: { data: null, isLoading: true, error: null },
    SILVER: { data: null, isLoading: true, error: null },
  });

  useEffect(() => {
    ASSETS.forEach((asset) => {
      fetchPrediction(asset)
        .then((data) =>
          setPredictions((prev) => ({
            ...prev,
            [asset]: { data, isLoading: false, error: null },
          }))
        )
        .catch((err) => {
          // Surface a friendly message — common culprit is CORS / server not running
          const isCors =
            err instanceof TypeError && err.message.toLowerCase().includes("fetch");
          setPredictions((prev) => ({
            ...prev,
            [asset]: {
              data: null,
              isLoading: false,
              error: isCors
                ? `Could not reach the ${asset} prediction API. Make sure your local server is running and CORS is enabled.`
                : err.message,
            },
          }));
        });
    });
  }, []);

  return (
    <div className={styles.pageWrapper}>
      <Header role="INVESTOR" />
      <main className={styles.container}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Market Analytics</h1>
          <p className={styles.pageSubtitle}>
            AI-powered predictions · Updated every hour
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {ASSETS.map((asset) => (
            <MarketPredictionCard
              key={asset}
              data={predictions[asset].data}
              isLoading={predictions[asset].isLoading}
              error={predictions[asset].error}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;