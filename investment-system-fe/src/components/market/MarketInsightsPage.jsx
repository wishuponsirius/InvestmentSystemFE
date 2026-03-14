import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { useMarketInsights } from "../../hooks/useMarketInsights";
import { numberFmt } from "../../services/marketInsightsService";

const RANGES = ["1w", "1m", "1y"];

const MiniLineChart = ({ seriesA = [], seriesB = [], range = "1m" }) => {
  const points = Math.max(seriesA.length, seriesB.length);
  if (!points || points < 2) {
    return <p className="text-gray-400 italic">No chart points from API yet.</p>;
  }

  const merged = [...seriesA, ...seriesB].filter((x) => Number.isFinite(x));
  const min = Math.min(...merged);
  const max = Math.max(...merged);
  const width = 900;
  const height = 240;
  const pad = 20;
  const showPointDetails = points <= 30 && range !== "1y";
  const maxLabels = 7;
  const step = points > maxLabels ? Math.ceil(points / maxLabels) : 1;

  const scaleX = (i) => pad + (i * (width - pad * 2)) / Math.max(points - 1, 1);
  const scaleY = (v) => {
    if (max === min) return height / 2;
    return height - pad - ((v - min) * (height - pad * 2)) / (max - min);
  };

  const toPath = (series) =>
    series
      .map((value, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(value)}`)
      .join(" ");

  const renderSeriesDetails = (series, color) =>
    showPointDetails
      ? series.map((value, i) => {
          if (!Number.isFinite(value)) return null;
          const x = scaleX(i);
          const y = scaleY(value);
          const shouldShowLabel = i === 0 || i === series.length - 1 || i % step === 0;
          const labelY = i % 2 === 0 ? y - 14 : y + 18;

          return (
            <g key={`${color}-${i}`}>
              <circle cx={x} cy={y} r="4" fill={color} />
              {shouldShowLabel && (
                <text
                  x={x}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={color}
                >
                  {value.toFixed(1)}
                </text>
              )}
            </g>
          );
        })
      : null;

  const gridLines = [1, 2, 3, 4].map((line) => {
    const y = (height * line) / 5;
    return <line key={line} x1={0} y1={y} x2={width} y2={y} stroke="#d1d5db" strokeWidth="1" />;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 bg-gray-50 rounded-lg border border-gray-100">
      {gridLines}
      <path d={toPath(seriesA)} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
      {renderSeriesDetails(seriesA, "#2563eb")}
      {seriesB.length > 0 && (
        <>
          <path d={toPath(seriesB)} fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          {renderSeriesDetails(seriesB, "#dc2626")}
        </>
      )}
    </svg>
  );
};

const riskClass = (styles, risk) => {
  if (risk === "High") return styles.badgeHighRisk;
  if (risk === "Medium") return "bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full font-bold";
  return "bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold";
};

const MarketInsightsPage = ({ styles, headerRole = "GUEST" }) => {
  const navigate = useNavigate();
  const isLoggedIn = headerRole !== "GUEST" || Boolean(localStorage.getItem("accessToken"));
  const [goldPriceType, setGoldPriceType] = React.useState("domestic");
  const [silverPriceType, setSilverPriceType] = React.useState("domestic");
  const {
    activeTab,
    setActiveTab,
    range,
    setRange,
    isLoading,
    error,
    reload,
    sjc,
    silverBase,
    productsGold,
    productsSilver,
    usdToVnd,
    worldGoldUsd,
    worldSilverUsd,
    worldGoldVnd,
    worldSilverVnd,
    goldSeries,
    silverSeries,
    currencySeries,
    goldDomesticChange,
    goldWorldChange,
    silverDomesticChange,
    silverWorldChange,
    currencyChange,
    goldSpreadGap,
    silverSpreadGap,
    goldRisk,
    silverRisk,
  } = useMarketInsights();

  const isGold = activeTab === "GOLD";
  const isSilver = activeTab === "SILVER";

  const domesticSell = isGold ? sjc?.sell || 0 : isSilver ? silverBase?.sell || 0 : usdToVnd;
  const domesticBuy = isGold ? sjc?.buy || 0 : isSilver ? silverBase?.buy || 0 : usdToVnd;
  const domesticChange = isGold ? goldDomesticChange : isSilver ? silverDomesticChange : currencyChange;

  const worldUsd = isGold ? worldGoldUsd : isSilver ? worldSilverUsd : 1;
  const worldVnd = isGold ? worldGoldVnd : isSilver ? worldSilverVnd : usdToVnd;
  const worldChange = isGold ? goldWorldChange : isSilver ? silverWorldChange : currencyChange;

  const spreadGap = isGold ? goldSpreadGap : isSilver ? silverSpreadGap : 0;
  const spreadRisk = isGold ? goldRisk : isSilver ? silverRisk : "Low";

  const selectedPriceType = isGold
    ? goldPriceType
    : isSilver
      ? silverPriceType
      : "domestic";

  const chartA = isGold
    ? selectedPriceType === "domestic"
      ? goldSeries.buy
      : goldSeries.world
    : isSilver
      ? selectedPriceType === "domestic"
        ? silverSeries.buy
        : silverSeries.world
      : currencySeries;
  const chartB = isGold
    ? selectedPriceType === "domestic"
      ? goldSeries.sell
      : []
    : isSilver
      ? selectedPriceType === "domestic"
        ? silverSeries.sell
        : []
      : [];

  const priceRows = isGold ? productsGold : isSilver ? productsSilver : [];

  return (
    <div className={styles.pageWrapper}>
      <Header role={headerRole} />

      <main className={styles.dashboardContainer}>
        <div className={styles.tabContainer}>
          {["GOLD", "SILVER", "FOREX"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.cardLabel}>{activeTab === "FOREX" ? "Exchange Rate" : "Domestic Price"}</span>
            <h2 className={styles.mainPrice}>
              {numberFmt(domesticSell, activeTab === "FOREX" ? 2 : 0)} {activeTab === "FOREX" ? "VND" : "VND"}
              <small>{activeTab === "FOREX" ? " / USD" : " / Ounce"}</small>
            </h2>
            <div className={styles.priceSub}>
              <span>Buy: {numberFmt(domesticBuy, activeTab === "FOREX" ? 2 : 0)} VND</span>
            </div>
            <span className={domesticChange >= 0 ? styles.trendUp : styles.trendDown}>
              {domesticChange >= 0 ? "Up" : "Down"} {Math.abs(domesticChange).toFixed(2)}%
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.cardLabel}>{activeTab === "FOREX" ? "USD Index" : "World Price"}</span>
            <h2 className={styles.mainPrice}>
              {numberFmt(worldVnd, activeTab === "FOREX" ? 2 : 0)} {activeTab === "FOREX" ? "VND" : "VND"}
              <small>{activeTab === "FOREX" ? " / USD" : " / Ounce"}</small>
            </h2>
            <div className={styles.priceSub}>
              <span>
                USD Price: {numberFmt(worldUsd, activeTab === "FOREX" ? 2 : 2)} USD
                {activeTab === "FOREX" ? "" : " / Ounce"}
              </span>
            </div>
            <span className={worldChange >= 0 ? styles.trendUp : styles.trendDown}>
              Approx converted from USD {worldChange >= 0 ? "↗" : "↘"} {Math.abs(worldChange).toFixed(2)}%
            </span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardLabel}>SPREAD GAP</span>
              <span className={riskClass(styles, spreadRisk)}>{spreadRisk} Risk</span>
            </div>
            <h2 className={styles.mainPrice}>
              {numberFmt(spreadGap, 0)} VND <small>{activeTab === "FOREX" ? "" : "/ Ounce"}</small>
            </h2>
            <p className={styles.riskDesc}>Gap compared with converted world benchmark.</p>
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={styles.sectionTitle}>Price Trend</h3>
            <div className="flex gap-2">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2 py-1 text-xs rounded-md border ${range === r ? "bg-yellow-100 border-yellow-400 text-yellow-800" : "bg-white border-gray-200 text-gray-500"}`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
              <button onClick={reload} className="px-3 py-1 text-xs rounded-md border border-gray-300 text-gray-600">
                Refresh
              </button>
            </div>
          </div>
          {activeTab !== "FOREX" && (
            <div className="mb-3 flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => (isGold ? setGoldPriceType("domestic") : setSilverPriceType("domestic"))}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${selectedPriceType === "domestic" ? "bg-white text-yellow-700 shadow-sm" : "text-gray-500"}`}
              >
                Domestic
              </button>
              <button
                onClick={() => (isGold ? setGoldPriceType("world") : setSilverPriceType("world"))}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${selectedPriceType === "world" ? "bg-white text-yellow-700 shadow-sm" : "text-gray-500"}`}
              >
                International
              </button>
            </div>
          )}
          <div className={styles.chartPlaceholder}>
            {isLoading ? <p className="text-gray-400 italic">Loading trend from API...</p> : <MiniLineChart seriesA={chartA} seriesB={chartB} range={range} />}
          </div>
          {activeTab !== "FOREX" && (
            <div className="mt-3 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-600" />
                <span>{selectedPriceType === "domestic" ? "Buy Price" : "International"}</span>
              </div>
              {selectedPriceType === "domestic" && (
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-600" />
                  <span>Sell Price</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.sectionContainer}>
          <h3 className={styles.sectionTitle}>Product</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Buy</th>
                  <th>Sell</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "FOREX" && (
                  <tr>
                    <td className="font-bold">USD / VND</td>
                    <td>{numberFmt(usdToVnd, 2)} VND</td>
                    <td>{numberFmt(usdToVnd, 2)} VND</td>
                  </tr>
                )}
                {activeTab !== "FOREX" && priceRows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-400">
                      No market rows from API.
                    </td>
                  </tr>
                )}
                {priceRows.map((item, index) => (
                  <tr key={`${item.provider}-${item.type}-${index}`}>
                    <td className="font-bold">{item.type}</td>
                    <td>
                      {numberFmt(item.buy, 0)} VND
                      <div className="text-xs text-gray-500">Spread {numberFmt(item.spread, 0)} VND</div>
                    </td>
                    <td>{numberFmt(item.sell, 0)} VND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.ctaBox}>
          {isLoggedIn ? (
            <>
              <h2 className={styles.ctaTitle}>Move From Market Signals To Portfolio Tracking</h2>
              <p className={styles.ctaDesc}>
                Review your holdings, compare entry price against the latest market moves, and decide where to rebalance next.
              </p>
              <button className={styles.ctaBtn} onClick={() => navigate("/portfolio")}>
                Open Portfolio Tracking
              </button>
            </>
          ) : (
            <>
              <h2 className={styles.ctaTitle}>Unlock Advanced Insights & Portfolio Tracking</h2>
              <p className={styles.ctaDesc}>
                Track your precious metals portfolio, simulate investments, and get personalized analytics.
              </p>
              <button className={styles.ctaBtn} onClick={() => navigate("/login")}>
                Login or Register to Get Started
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketInsightsPage;
