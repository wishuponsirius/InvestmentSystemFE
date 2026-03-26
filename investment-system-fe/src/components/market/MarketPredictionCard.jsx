import React from "react";
import styles from "./MarketPredictionCard.module.css";

const ASSET_CONFIG = {
  GOLD: {
    symbol: "XAU",
    icon: "◈",
    accentColor: "#B8860B",
    lightColor: "#FFF8E7",
    gradientFrom: "#B8860B",
    gradientTo: "#ffeb7a",
  },
  SILVER: {
    symbol: "XAG",
    icon: "◇",
    accentColor: "#7A8FA6",
    lightColor: "#F0F4F8",
    gradientFrom: "#7A8FA6",
    gradientTo: "#C0C0C0",
  },
};

const ConfidenceArc = ({ value, color }) => {
  const radius = 36;
  const circumference = Math.PI * radius; // half circle
  const filled = (value / 100) * circumference;
  const gap = circumference;

  return (
    <svg width="96" height="56" viewBox="0 0 96 56" className={styles.arc}>
      {/* background arc */}
      <path
        d="M 8 52 A 40 40 0 0 1 88 52"
        fill="none"
        stroke="#E5E7EB"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* foreground arc */}
      <path
        d="M 8 52 A 40 40 0 0 1 88 52"
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text
        x="48"
        y="46"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#111827"
      >
        {value}%
      </text>
    </svg>
  );
};

const PredictionBadge = ({ direction, timeframe }) => {
  const isUp = direction === "UP";
  return (
    <div className={`${styles.badge} ${isUp ? styles.badgeUp : styles.badgeDown}`}>
      <span className={styles.badgeArrow}>{isUp ? "↑" : "↓"}</span>
      <span>{direction}</span>
      <span className={styles.badgeTimeframe}>{timeframe}</span>
    </div>
  );
};

const MarketPredictionCard = ({ data, isLoading, error }) => {
  const config = data ? ASSET_CONFIG[data.asset] || ASSET_CONFIG["GOLD"] : ASSET_CONFIG["GOLD"];

  if (isLoading) {
    return (
      <div className={styles.card} style={{ "--accent": config.accentColor }}>
        <div className={styles.shimmer} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.card} style={{ "--accent": config.accentColor }}>
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠</span>
          <p className={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      className={styles.card}
      style={{
        "--accent": config.accentColor,
        "--accent-light": config.lightColor,
        "--gradient-from": config.gradientFrom,
        "--gradient-to": config.gradientTo,
      }}
    >
      {/* Header strip */}
      <div className={styles.header}>
        <div className={styles.assetInfo}>
          <span className={styles.assetIcon}>{config.icon}</span>
          <div>
            <h2 className={styles.assetName}>{data.asset}</h2>
            <span className={styles.assetSymbol}>{config.symbol} / USD</span>
          </div>
        </div>
        <div className={styles.headerBadges}>
          <PredictionBadge direction={data.prediction_24h} timeframe="24H" />
          <PredictionBadge direction={data.prediction_7d} timeframe="7D" />
        </div>
      </div>

      {/* Confidence meters */}
      <div className={styles.confidenceRow}>
        <div className={styles.confidenceItem}>
          <ConfidenceArc value={data.confidence_24h} color={config.accentColor} />
          <p className={styles.confidenceLabel}>24H Confidence</p>
        </div>
        <div className={styles.divider} />
        <div className={styles.confidenceItem}>
          <ConfidenceArc value={data.confidence_7d} color={config.accentColor} />
          <p className={styles.confidenceLabel}>7D Confidence</p>
        </div>
      </div>

      {/* Reasoning */}
      <div className={styles.reasoning}>
        <p className={styles.reasoningLabel}>AI Reasoning</p>
        <p className={styles.reasoningText}>{data.reasoning}</p>
      </div>

      {/* News */}
      <div className={styles.newsSection}>
        <p className={styles.newsLabel}>Top Signals</p>
        <ul className={styles.newsList}>
          {data.top3_news.map((headline, i) => (
            <li key={i} className={styles.newsItem}>
              <span className={styles.newsIndex}>{i + 1}</span>
              <span className={styles.newsText}>{headline}</span>
            </li>
          ))}
        </ul>
      </div>

          {/* Timestamp */}
          {data.created_at && (
              <div className={styles.timestamp}>
                  Report generated {new Date(data.created_at).toLocaleString()}
              </div>
          )}
    </div>
  );
};

export default MarketPredictionCard;