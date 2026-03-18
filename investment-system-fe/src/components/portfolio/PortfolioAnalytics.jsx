import React, { useState, useEffect } from "react";
import {
  fetchPortfolioAIAnalysis,
  fetchLastPortfolioReport,
} from "../../services/portfolioService.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " VND";
const fmtShort = (v) => {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + "M";
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(2);
};
const fmtPct = (v) => (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
const fmtPrice = (v) => new Intl.NumberFormat("vi-VN").format(Math.round(v));

// Conversion factors from VND/gram → display unit
const PRICE_MULTIPLIER = { Gold: 37.5, Silver: 1000 }; // Gold: 1 Lượng = 37.5g, Silver: 1 Kg = 1000g
const PRICE_UNIT_LABEL = { Gold: "Lượng", Silver: "Kg", USD: "" };

const fmtAssetPrice = (pricePerGram, asset) => {
  if (asset === "USD") return fmtPrice(pricePerGram);
  const multiplier = PRICE_MULTIPLIER[asset] ?? 1;
  const converted = pricePerGram * multiplier;
  const label = PRICE_UNIT_LABEL[asset];
  if (converted >= 1_000_000)
    return `đ ${(converted / 1_000_000).toFixed(2)}M/${label}`;
  if (converted >= 1_000)
    return `đ ${(converted / 1_000).toFixed(1)}K/${label}`;
  return `đ ${converted.toFixed(0)}/${label}`;
};

const ASSET_COLOR = { Gold: "#FFDA91", Silver: "#9fa4ab", USD: "#3d3d3d" };
const ASSET_ICON = { Gold: "◈", Silver: "◇", USD: "$" };

// ─── Sub-components ───────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const size = 160, cx = 80, cy = 80, r = 58, stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = data.map((d) => {
    const dash = d.weight * circ;
    const gap = circ - dash;
    const s = { ...d, dash, gap, offset };
    offset += dash;
    return s;
  });
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
    >
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={ASSET_COLOR[s.asset]}
          strokeWidth={stroke}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

function ConvictionBar({ value }) {
  const pct = Math.round(value * 100);
  const color =
    pct > 70 ? "#22c55e" : pct > 50 ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          background: "#E8E0D0",
          borderRadius: 9999,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 9999,
            transition: "width .5s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "#6B5E4A",
          minWidth: 32,
          textAlign: "right",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function RSIGauge({ value }) {
  const pct = Math.min(100, Math.max(0, value));
  const color =
    pct > 70 ? "#ef4444" : pct < 30 ? "#3b82f6" : "#f59e0b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "#E8E0D0",
          borderRadius: 9999,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 9999,
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function CorrelationHeatmap({ matrix }) {
  const assets = Object.keys(matrix);

  const cellColor = (v) => {
    if (v === 1) return "#D4B896";
    if (v > 0.7) return "#B45309";
    if (v > 0.3) return "#D97706";
    return "#E8E0D0";
  };

  const textColor = (v) => (v > 0.3 ? "#fff" : "#6B5E4A");

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
      <thead>
        <tr>
          <th></th>
          {assets.map((a) => (
            <th key={a} style={{ padding: "6px 10px", textAlign: "center" }}>
              {a}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {assets.map((row) => (
          <tr key={row}>
            <td style={{ padding: "6px 10px", fontWeight: 600 }}>{row}</td>
            {assets.map((col) => {
              const v = matrix[row]?.[col] ?? 0;
              return (
                <td
                  key={col}
                  style={{
                    padding: "6px 10px",
                    textAlign: "center",
                    borderRadius: 6,
                    background: cellColor(v),
                    color: textColor(v),
                  }}
                >
                  {v.toFixed(3)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const ds = {
  dashContent: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
    fontFamily: "'Inter', sans-serif",
  },
  subTitle: { fontSize: 13, color: "#99a1af", marginTop: 2, marginBottom: 16 },
  card: {
    background: "#FFFFFF",
    borderRadius: 16,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 16,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: 12,
  },
  summaryCard: () => ({
    background: "#FFFFFF",
    border: "1px solid #EEE8DF",
    borderRadius: 14,
    padding: "16px 18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }),
  summaryLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  summaryValue: (color) => ({
    fontSize: 22,
    fontWeight: 800,
    color: color || "#2C1F0E",
    marginTop: 4,
    lineHeight: 1.1,
  }),
  summarySub: { fontSize: 12, color: "#99a1af", marginTop: 3 },
  alert: {
    background: "#FFF7ED",
    border: "1px solid #FED7AA",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  recoGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
  recoCard: {
    background: "#FFFFFF",
    border: "1px solid #EEE8DF",
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  badge: (type) => {
    const map = {
      HOLD: ["#FEF3C7", "#D97706"],
      BUY: ["#DCFCE7", "#16A34A"],
      SELL: ["#FEE2E2", "#DC2626"],
      LOW: ["#F1F5F9", "#64748B"],
      HIGH: ["#FEE2E2", "#DC2626"],
      NEUTRAL: ["#F1F5F9", "#64748B"],
    };
    const [bg, col] = map[type] || ["#F1F5F9", "#64748B"];
    return {
      background: bg,
      color: col,
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 6,
      padding: "2px 8px",
      display: "inline-block",
    };
  },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "8px 12px",
    textAlign: "left",
    color: "#9B8B7A",
    fontWeight: 700,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #EEE8DF",
  },
  td: { padding: "10px 12px", borderBottom: "1px solid #F5F0E8" },
  riskGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
  riskCard: {
    background: "#FAFAF8",
    border: "1px solid #EEE8DF",
    borderRadius: 12,
    padding: "14px 16px",
  },
  riskLabel: {
    fontSize: 11,
    color: "#9B8B7A",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  riskValue: (warn) => ({
    fontSize: 20,
    fontWeight: 800,
    color: warn ? "#DC2626" : "#2C1F0E",
    marginTop: 4,
  }),
  riskHint: { fontSize: 11, color: "#9B8B7A", marginTop: 2 },
  signalRow: {
    border: "1px solid #EEE8DF",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
    marginBottom: 8,
    background: "#FAFAF8",
  },
  signalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
  },
  signalDetail: {
    padding: "0 16px 14px 16px",
    borderTop: "1px solid #EEE8DF",
    background: "#fff",
  },
  explanationBox: {
    background: "#FAFAF8",
    border: "1px solid #EEE8DF",
    borderRadius: 12,
    padding: "16px",
    fontSize: 13,
    color: "#4A3B2A",
    lineHeight: 1.7,
    whiteSpace: "pre-line",
  },
  generateBtn: (loading) => ({
    background: loading ? "#D4C9B8" : "#2C1F0E",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 22px",
    fontSize: 13,
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    transition: "background .2s",
  }),
  pnlColor: (v) => ({
    color: v >= 0 ? "#16A34A" : "#DC2626",
    fontWeight: 700,
  }),
  returnColor: (v) => ({
    color: v >= 0 ? "#16A34A" : "#DC2626",
    fontWeight: 800,
    fontSize: 14,
  }),
};

// ─── Main exported component ──────────────────────────────────────────────────
const PortfolioAnalytics = () => {
  const [data, setData] = useState(null);
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  const [pageState, setPageState] = useState("loading"); // "loading" | "empty" | "ready"
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const report = await fetchLastPortfolioReport();
        setData(report);
        setPageState("ready");
      } catch (err) {
        const is404 =
          err?.status === 404 ||
          err?.response?.status === 404 ||
          err?.message?.includes("404");
        if (is404) {
          setPageState("empty");
        } else {
          console.error("Failed to load report:", err);
          setPageState("empty");
        }
      }
    };
    loadAnalysis();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const generated = await fetchPortfolioAIAnalysis();
      setData(generated);
      setPageState("ready");
    } catch (genErr) {
      console.error("Failed to generate analysis:", genErr);
      const isNoPortfolio =
        genErr?.status === 404 ||
        genErr?.response?.status === 404 ||
        genErr?.message?.includes("No portfolio found");
      if (isNoPortfolio) {
        setGenerateError("no_portfolio");
      } else {
        setGenerateError("generic");
      }
    } finally {
      setGenerating(false);
    }
  };

  const d = data;

  // ── Loading state ──
  if (pageState === "loading") {
    return (
      <section style={{ padding: "32px 0" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2C1F0E", marginBottom: 8 }}>
          Portfolio Analytics
        </h2>
        <p style={{ color: "#9B8B7A" }}>Loading your latest report…</p>
      </section>
    );
  }

  // ── Empty state ──
  if (pageState === "empty") {
    return (
      <section style={{ padding: "32px 0" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#2C1F0E", marginBottom: 24 }}>
          Portfolio Analytics
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 52 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#2C1F0E" }}>
            No analysis report yet
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#9B8B7A",
              maxWidth: 400,
              lineHeight: 1.7,
            }}
          >
            You haven't generated a portfolio analysis report yet. Click the
            button below to let AI analyse your current portfolio and generate a
            full report.
          </div>
          {generateError === "no_portfolio" && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "12px 16px",
                maxWidth: 420,
                fontSize: 13,
                color: "#991B1B",
                lineHeight: 1.6,
              }}
            >
              <strong>No portfolio found.</strong> You need to create a
              portfolio before generating an analysis.{" "}
              <a
                href="/portfolio"
                style={{
                  color: "#DC2626",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Create your portfolio →
              </a>
            </div>
          )}
          {generateError === "generic" && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "12px 16px",
                maxWidth: 420,
                fontSize: 13,
                color: "#991B1B",
              }}
            >
              Something went wrong while generating the analysis. Please try
              again.
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={ds.generateBtn(generating)}
          >
            {generating ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 13,
                    height: 13,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Generating…
              </>
            ) : (
              "✦ Generate new AI Analysis"
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

  // ── Ready state ──
  return (
    <section style={{ paddingTop: 40 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 4,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#2C1F0E",
            margin: 0,
          }}
        >
          Portfolio Analytics
        </h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={ds.generateBtn(generating)}
        >
          {generating ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 13,
                  height: 13,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              Generating…
            </>
          ) : (
            "✦ Generate new AI Analysis"
          )}
        </button>
      </div>
      <p style={ds.subTitle}>
        Last updated: {new Date(d.generated_at).toLocaleString()}
      </p>

      {/* Dashboard content */}
      <div style={ds.dashContent}>

        {/* Alerts */}
        {d.alerts.map((a, i) => (
          <div key={i} style={ds.alert}>
            <span style={{ fontSize: 18, color: "#F59E0B" }}>⚠</span>
            <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
              {a}
            </span>
          </div>
        ))}

        {/* Summary Cards */}
        <div style={ds.summaryGrid}>
          <div style={ds.summaryCard()}>
            <div style={ds.summaryLabel}>Portfolio Value</div>
            <div style={ds.summaryValue()}>{fmtVND(d.portfolio_value_vnd)}</div>
            <div style={ds.summarySub}>total value in VND</div>
          </div>
          <div style={ds.summaryCard()}>
            <div style={ds.summaryLabel}>Total Return</div>
            <div
              style={ds.summaryValue(
                d.total_return_pct >= 0 ? "#16A34A" : "#DC2626"
              )}
            >
              {fmtPct(d.total_return_pct)}
            </div>
            <div style={ds.summarySub}>since inception</div>
          </div>
          <div style={ds.summaryCard()}>
            <div style={ds.summaryLabel}>Best Performer</div>
            <div
              style={{
                ...ds.summaryValue("#D97706"),
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{ASSET_ICON[d.best_performer]}</span>
              {d.best_performer}
            </div>
            <div style={ds.summarySub}>top return asset</div>
          </div>
          <div style={ds.summaryCard()}>
            <div style={ds.summaryLabel}>Diversification</div>
            <div style={ds.summaryValue("#D97706")}>
              {(d.diversification_score * 100).toFixed(0)}/100
            </div>
            <div style={ds.summarySub}>Low — concentrated</div>
          </div>
          <div style={{ ...ds.summaryCard(), border: "1px solid #FED7AA" }}>
            <div style={ds.summaryLabel}>Alerts</div>
            <div style={ds.summaryValue("#F59E0B")}>{d.alerts.length}</div>
            <div style={ds.summarySub}>active risk flag</div>
          </div>
        </div>

        {/* Recommendation Summary */}
        <div style={ds.card}>
          <div style={ds.cardTitle}>Recommendation Summary</div>
          <div
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 13,
              color: "#166534",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            ✓ {d.recommendation_summary}
          </div>
          <div style={ds.recoGrid}>
            {d.trade_recommendations.map((r) => (
              <div key={r.asset} style={ds.recoCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 18, color: ASSET_COLOR[r.asset] }}>
                    {ASSET_ICON[r.asset]}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>
                    {r.asset}
                  </span>
                  <span style={{ marginLeft: "auto" }}>
                    <span style={ds.badge(r.action)}>{r.action}</span>
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  <span style={ds.badge(r.urgency)}>
                    Urgency: {r.urgency}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9B8B7A", marginBottom: 10 }}>
                  {r.rationale}
                </div>
                <div style={{ fontSize: 11, color: "#9B8B7A", marginBottom: 6 }}>
                  Conviction
                </div>
                <ConvictionBar value={r.conviction} />
                <div
                  style={{
                    fontSize: 11,
                    color: "#9B8B7A",
                    marginTop: 8,
                    fontStyle: "italic",
                  }}
                >
                  {r.size_hint}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation + Performance */}
        <div style={ds.twoCol}>
          {/* Donut */}
          <div style={ds.card}>
            <div style={ds.cardTitle}>Asset Allocation</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flexShrink: 0 }}>
                <DonutChart data={d.allocation} />
              </div>
              <div style={{ flex: 1 }}>
                {d.allocation.map((a) => (
                  <div
                    key={a.asset}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: ASSET_COLOR[a.asset],
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <span>{a.asset}</span>
                        <span>{(a.weight * 100).toFixed(2)}%</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#99a1af" }}>
                        {fmtShort(a.value_vnd)} VND · {a.quantity}{" "}
                        {a.unit_symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Table */}
          <div style={ds.card}>
            <div style={ds.cardTitle}>Performance by Asset</div>
            <table style={ds.table}>
              <thead>
                <tr>
                  {["Asset", "Entry Price", "Current", "P&L", "Return"].map(
                    (h) => (
                      <th key={h} style={ds.th}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {d.performance.map((p) => (
                  <tr
                    key={p.asset}
                    style={{
                      background:
                        p.asset === d.best_performer
                          ? "#FFFBEB"
                          : "transparent",
                    }}
                  >
                    <td style={ds.td}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            color: ASSET_COLOR[p.asset],
                            fontWeight: 800,
                          }}
                        >
                          {ASSET_ICON[p.asset]}
                        </span>
                        <span style={{ fontWeight: 700 }}>{p.asset}</span>
                        {p.asset === d.best_performer && (
                          <span title="Best performer">🏆</span>
                        )}
                      </div>
                    </td>
                    <td style={ds.td}>
                      <span style={{ fontSize: 12, color: "#6B5E4A" }}>
                        {fmtAssetPrice(p.entry_price, p.asset)}
                      </span>
                    </td>
                    <td style={ds.td}>
                      <span style={{ fontWeight: 700 }}>
                        {fmtAssetPrice(p.current_price, p.asset)}
                      </span>
                    </td>
                    <td style={ds.td}>
                      <span style={ds.pnlColor(p.pnl)}>
                        {p.pnl >= 0 ? "+" : "-"}
                        {fmtShort(Math.abs(p.pnl))}
                      </span>
                    </td>
                    <td style={ds.td}>
                      <span style={ds.returnColor(p.return_pct)}>
                        {fmtPct(p.return_pct)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk + Diversification */}
        <div style={ds.card}>
          <div style={ds.cardTitle}>Risk Overview</div>
          <div style={ds.riskGrid}>
            <div style={ds.riskCard}>
              <div style={ds.riskLabel}>Annualized Volatility</div>
              <div style={ds.riskValue(true)}>
                {(d.risk.volatility_annualized * 100).toFixed(2)}%
              </div>
              <div style={ds.riskHint}>
                High — broad price swings expected
              </div>
            </div>
            <div style={ds.riskCard}>
              <div style={ds.riskLabel}>1-Day VaR (95%)</div>
              <div style={ds.riskValue(true)}>
                −₫{fmtShort(Math.abs(d.risk.var_95_1day))}
              </div>
              <div style={ds.riskHint}>
                Max expected 1-day loss (95% conf.)
              </div>
            </div>
            <div style={ds.riskCard}>
              <div style={ds.riskLabel}>Sharpe Ratio</div>
              <div style={ds.riskValue(false)}>
                {d.risk.sharpe_ratio.toFixed(3)}
              </div>
              <div style={ds.riskHint}>
                Return per unit of risk — low
              </div>
            </div>
            <div style={ds.riskCard}>
              <div style={ds.riskLabel}>Max Drawdown</div>
              <div style={ds.riskValue(true)}>
                {(d.risk.max_drawdown * 100).toFixed(2)}%
              </div>
              <div style={ds.riskHint}>Worst peak-to-trough decline</div>
            </div>
          </div>

          {/* Diversification bar */}
          <div
            style={{
              marginTop: 20,
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  Diversification Score
                </span>
                <span style={{ fontSize: 12, color: "#9B8B7A", marginLeft: 8 }}>
                  — Low
                </span>
              </div>
              <span
                style={{ fontWeight: 800, fontSize: 20, color: "#D97706" }}
              >
                {(d.diversification_score * 100).toFixed(0)} / 100
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "#E8E0D0",
                borderRadius: 9999,
              }}
            >
              <div
                style={{
                  width: `${d.diversification_score * 100}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#F59E0B,#D97706)",
                  borderRadius: 9999,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#92400E",
                marginTop: 8,
              }}
            >
              Portfolio is concentrated in Gold and Silver, which share a high
              correlation of 0.902. This significantly limits diversification
              benefits.
            </div>
          </div>
        </div>

        {/* Market Signals */}
        <div style={ds.card}>
          <div style={ds.cardTitle}>Market Signals</div>
          {d.signals.map((s) => {
            const open = expandedSignal === s.asset;
            return (
              <div
                key={s.asset}
                style={ds.signalRow}
                onClick={() => setExpandedSignal(open ? null : s.asset)}
              >
                <div style={ds.signalHeader}>
                  <span
                    style={{
                      color: ASSET_COLOR[s.asset],
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                  >
                    {ASSET_ICON[s.asset]}
                  </span>
                  <span style={{ fontWeight: 700, minWidth: 60 }}>
                    {s.asset}
                  </span>
                  <span style={ds.badge(s.signal)}>{s.signal}</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: "#6B5E4A",
                      marginLeft: 8,
                    }}
                  >
                    {s.reason}
                  </span>
                  {s.spread_signal && (
                    <span style={ds.badge(s.spread_signal)}>
                      Spread: {s.spread_signal}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      color: "#9B8B7A",
                      marginLeft: 8,
                    }}
                  >
                    {open ? "▲" : "▼"}
                  </span>
                </div>
                {open && (
                  <div style={ds.signalDetail}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 16,
                        marginTop: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9B8B7A",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Moving Averages (
                          {PRICE_UNIT_LABEL[s.asset]
                            ? `VND/${PRICE_UNIT_LABEL[s.asset]}`
                            : "VND"}
                          )
                        </div>
                        {[
                          ["MA-7", s.ma_7],
                          ["MA-30", s.ma_30],
                          ["MA-90", s.ma_90],
                        ].map(([label, val]) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: 13,
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ color: "#6B5E4A" }}>{label}</span>
                            <span style={{ fontWeight: 700 }}>
                              {fmtAssetPrice(val, s.asset)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9B8B7A",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          RSI (14)
                        </div>
                        <RSIGauge value={s.rsi_14} />
                        <div
                          style={{ fontSize: 11, color: "#9B8B7A", marginTop: 4 }}
                        >
                          {s.rsi_14 > 70
                            ? "⚠ Overbought"
                            : s.rsi_14 < 30
                            ? "⚠ Oversold"
                            : "Neutral zone"}
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#9B8B7A",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Z-Score
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color:
                              Math.abs(s.z_score) > 2 ? "#DC2626" : "#2C1F0E",
                          }}
                        >
                          {s.z_score.toFixed(3)}
                        </div>
                        <div style={{ fontSize: 11, color: "#9B8B7A" }}>
                          {Math.abs(s.z_score) > 2
                            ? "Statistical outlier"
                            : "Within normal range"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Correlation Heatmap */}
        <div style={ds.card}>
          <div style={ds.cardTitle}>Correlation Matrix</div>
          <div style={{ fontSize: 12, color: "#9B8B7A", marginBottom: 12 }}>
            Values close to 1.0 indicate assets move together — reducing
            diversification benefit.
          </div>
          <CorrelationHeatmap matrix={d.risk.correlation_matrix} />
          <div
            style={{
              fontSize: 12,
              color: "#92400E",
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
              borderRadius: 8,
              padding: "8px 12px",
              marginTop: 12,
            }}
          >
            ⚠ Gold ↔ Silver correlation is <strong>0.902</strong> — these
            assets provide minimal diversification against each other.
          </div>
        </div>

        {/* AI Explanation */}
        <div style={ds.card}>
          <div style={ds.cardTitle}>AI Portfolio Explanation</div>
          <div style={ds.explanationBox}>
            {showFullExplanation
              ? d.explanation
              : d.explanation.slice(0, 300) + "…"}
          </div>
          <button
            onClick={() => setShowFullExplanation((v) => !v)}
            style={{
              marginTop: 10,
              background: "none",
              border: "1px solid #E8E0D0",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 12,
              color: "#6B5E4A",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {showFullExplanation ? "Show less ▲" : "Read full analysis ▼"}
          </button>
        </div>

      </div>
    </section>
  );
};

export default PortfolioAnalytics;
