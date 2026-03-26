import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe2,
  Newspaper,
  RefreshCcw,
  Scale,
} from "lucide-react";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { useMarketInsights } from "../../hooks/useMarketInsights";
import { numberFmt } from "../../services/marketInsightsService";

const RANGE_OPTIONS = [
  ["1w", "1 Week"],
  ["1m", "1 Month"],
  ["6m", "6 Months"],
  ["1y", "1 Year"],
];

const META = {
  GOLD: {
    title: "Gold: Domestic SJC vs. International Spot",
    localLabel: "SJC Gold",
    benchmarkLabel: "Spot Gold",
    unit: "Luong",
    unitShort: "luong",
    premiumLabel: "Domestic Premium (VND/Luong)",
  },
  SILVER: {
    title: "Silver: Phu Quy Domestic vs. International Spot",
    localLabel: "Phu Quy Silver",
    benchmarkLabel: "Spot Silver",
    unit: "Kg",
    unitShort: "kg",
    premiumLabel: "Domestic Premium (VND/Kg)",
  },
  FOREX: {
    title: "FX: USD/VND Trend Dashboard",
    localLabel: "USD/VND",
    benchmarkLabel: "USD/VND",
    unit: "USD",
    unitShort: "usd",
    premiumLabel: "FX Momentum (%)",
  },
};

const NEWS = {
  GOLD: [
    ["Fed tone keeps bullion traders defensive", "11 days ago"],
    ["Domestic premium widens as local demand firms", "13 days ago"],
    ["Spot gold consolidates near resistance", "15 days ago"],
  ],
  SILVER: [
    ["Silver tracks industrial optimism and softer yields", "7 days ago"],
    ["Local silver spreads stay firm despite pullback", "10 days ago"],
    ["Analysts watch breakout zone for spot silver", "14 days ago"],
  ],
  FOREX: [
    ["USD/VND remains supported by external dollar strength", "4 days ago"],
    ["Traders monitor SBV liquidity and import demand", "8 days ago"],
    ["FX desks expect range trading ahead of macro releases", "12 days ago"],
  ],
};

const compactFmt = (value, digits = 1) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const signedPct = (value) => `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;

const fmtDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleString("en-US", { month: "short" })} ${date.getDate()}`;
};

const lastFinite = (series, fallback = 0) => {
  for (let index = (series || []).length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(series[index])) return series[index];
  }
  return fallback;
};

const valueRange = (series, fallback = [0, 1]) => {
  const values = (series || []).filter((value) => Number.isFinite(value));
  if (!values.length) return { min: fallback[0], max: fallback[1] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = min === max ? Math.abs(min || 1) * 0.08 : (max - min) * 0.12;
  return { min: min - padding, max: max + padding };
};

const pathFor = (series, scaleX, scaleY) => {
  let path = "";
  let started = false;
  (series || []).forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    path += `${started ? "L" : "M"} ${scaleX(index)} ${scaleY(value)} `;
    started = true;
  });
  return path.trim();
};

const areaFor = (series, scaleX, scaleY, baseY) => {
  const first = (series || []).findIndex((value) => Number.isFinite(value));
  if (first < 0) return "";
  let last = first;
  for (let index = series.length - 1; index >= first; index -= 1) {
    if (Number.isFinite(series[index])) {
      last = index;
      break;
    }
  }
  let path = `M ${scaleX(first)} ${baseY} `;
  for (let index = first; index <= last; index += 1) {
    if (Number.isFinite(series[index])) path += `L ${scaleX(index)} ${scaleY(series[index])} `;
  }
  path += `L ${scaleX(last)} ${baseY} Z`;
  return path;
};

const sampleSeriesByRange = ({ dates, buySeries, sellSeries, range }) => {
  if (!Array.isArray(dates) || dates.length === 0) {
    return { dates: dates || [], buySeries: buySeries || [], sellSeries: sellSeries || [] };
  }

  const targetPoints = range === "1w" ? 7 : range === "1m" ? 30 : range === "6m" ? 26 : 0;
  if (!targetPoints || dates.length <= targetPoints) {
    return { dates, buySeries, sellSeries };
  }

  const step = Math.max(1, Math.ceil(dates.length / targetPoints));
  const sampledDates = [];
  const sampledBuy = [];
  const sampledSell = [];
  for (let i = 0; i < dates.length; i += step) {
    sampledDates.push(dates[i]);
    sampledBuy.push(buySeries[i]);
    sampledSell.push(sellSeries[i]);
  }
  if (sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]) {
    sampledDates.push(dates[dates.length - 1]);
    sampledBuy.push(buySeries[buySeries.length - 1]);
    sampledSell.push(sellSeries[sellSeries.length - 1]);
  }
  return { dates: sampledDates, buySeries: sampledBuy, sellSeries: sampledSell };
};

const riskTone = (risk) => {
  if (risk === "Extreme") return "bg-rose-600 text-white border border-rose-700 shadow-[0_10px_28px_rgba(225,29,72,0.24)]";
  if (risk === "High") return "bg-red-600 text-white border border-red-700 shadow-[0_10px_28px_rgba(220,38,38,0.22)]";
  if (risk === "Medium") return "bg-amber-400 text-amber-950 border border-amber-500 shadow-[0_10px_24px_rgba(245,158,11,0.18)]";
  return "bg-emerald-500 text-white border border-emerald-600 shadow-[0_10px_22px_rgba(16,185,129,0.18)]";
};

const ChartPanel = ({
  dates,
  leftSeries,
  rightSeries,
  bars,
  leftLabel,
  rightLabel,
  leftKind,
  rightKind,
  barLabel,
  loading,
  emptyText,
  activeTab,
}) => {
  const [hoverIndex, setHoverIndex] = React.useState(null);

  if (loading) {
    return <div className="flex h-[500px] items-center justify-center rounded-[24px] border border-slate-200 bg-white text-slate-500 shadow-sm">Loading market structure...</div>;
  }

  const total = Math.max(dates.length, leftSeries.length, rightSeries.length, bars.length);
  const hasLeft = leftSeries.some((value) => Number.isFinite(value));
  if (total < 2 || !hasLeft) {
    return <div className="flex h-[500px] items-center justify-center rounded-[24px] border border-slate-200 bg-white text-slate-500 shadow-sm">{emptyText}</div>;
  }

  const width = 1060;
  const height = 500;
  const leftPad = 72;
  const rightPad = 72;
  const topPad = 56;
  const chartHeight = 240;
  const chartBottom = topPad + chartHeight;
  const barTop = 346;
  const barHeight = 92;
  const plotWidth = width - leftPad - rightPad;
  const leftRange = valueRange(leftSeries);
  const rightRange = valueRange(rightSeries, [leftRange.min, leftRange.max]);
  const barValues = bars.filter((value) => Number.isFinite(value));
  const barMin = barValues.length ? Math.min(0, Math.min(...barValues)) : 0;
  const barMax = barValues.length ? Math.max(0, Math.max(...barValues)) : 1;
  const barSpread = barMax - barMin || 1;
  const step = total > 7 ? Math.ceil(total / 7) : 1;
  const scaleX = (index) => leftPad + (index * plotWidth) / Math.max(total - 1, 1);
  const scaleLeft = (value) => chartBottom - ((value - leftRange.min) * chartHeight) / Math.max(leftRange.max - leftRange.min, 1);
  const scaleRight = (value) => chartBottom - ((value - rightRange.min) * chartHeight) / Math.max(rightRange.max - rightRange.min, 1);
  const zeroBar = barTop + barHeight - ((0 - barMin) * barHeight) / barSpread;
  const scaleBar = (value) => barTop + barHeight - ((value - barMin) * barHeight) / barSpread;
  const barWidth = Math.max((plotWidth / Math.max(total, 1)) * 0.68, 4);
  const positiveBar = activeTab === "FOREX" ? "#22c55e" : "#f87171";
  const negativeBar = activeTab === "FOREX" ? "#f59e0b" : "#fca5a5";
  const current = total - 1;
  const tooltipIndex = hoverIndex != null ? Math.max(0, Math.min(current, hoverIndex)) : null;
  const hoverDate = tooltipIndex != null ? dates[tooltipIndex] : null;
  const hoverPremium = tooltipIndex != null ? bars[tooltipIndex] : null;
  const hoverDomestic = tooltipIndex != null ? leftSeries[tooltipIndex] : null;
  const tooltipX = tooltipIndex != null ? Math.min(Math.max(scaleX(tooltipIndex), leftPad + 80), width - rightPad - 80) : 0;
  const tooltipY = topPad + 8;
  const showTooltip = tooltipIndex != null && (Number.isFinite(hoverPremium) || Number.isFinite(hoverDomestic));

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-4 px-2 text-sm font-medium text-slate-700">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan-500" />{leftLabel}</span>
        {rightSeries.some((value) => Number.isFinite(value)) && <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-400" />{rightLabel}</span>}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[500px] w-full"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="terminalAreaLeft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(14,165,233,0.24)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0.02)" />
          </linearGradient>
          <linearGradient id="terminalAreaRight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,158,11,0.22)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0.02)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((line) => {
          const y = topPad + (line * chartHeight) / 4;
          const leftValue = leftRange.max - ((leftRange.max - leftRange.min) * line) / 4;
          const rightValue = rightRange.max - ((rightRange.max - rightRange.min) * line) / 4;
          return (
            <g key={`grid-${line}`}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="rgba(226,232,240,0.9)" />
              <text x={leftPad - 12} y={y + 4} textAnchor="end" fontSize="12" fill="#64748b">
                {leftKind === "vnd" ? compactFmt(leftValue) : numberFmt(leftValue, 0)}
              </text>
              {rightSeries.some((value) => Number.isFinite(value)) && (
                <text x={width - rightPad + 12} y={y + 4} fontSize="12" fill="#64748b">
                  {rightKind === "vnd" ? compactFmt(rightValue) : numberFmt(rightValue, 0)}
                </text>
              )}
            </g>
          );
        })}

        <rect x={leftPad} y={topPad} width={plotWidth} height={barTop + barHeight - topPad} fill="none" stroke="rgba(226,232,240,0.9)" strokeDasharray="3 4" />

        <text x="18" y={topPad + chartHeight / 2} fontSize="12" fill="#64748b" transform={`rotate(-90 18 ${topPad + chartHeight / 2})`}>
          {leftLabel}
        </text>
        {rightSeries.some((value) => Number.isFinite(value)) && (
          <text x={width - 18} y={topPad + chartHeight / 2} fontSize="12" fill="#64748b" transform={`rotate(90 ${width - 18} ${topPad + chartHeight / 2})`}>
            {rightLabel}
          </text>
        )}

        <path d={areaFor(leftSeries, scaleX, scaleLeft, chartBottom)} fill="url(#terminalAreaLeft)" />
        <path d={pathFor(leftSeries, scaleX, scaleLeft)} fill="none" stroke="#06b6d4" strokeWidth="2.2" strokeLinecap="round" />
        {rightSeries.some((value) => Number.isFinite(value)) && (
          <>
            <path d={areaFor(rightSeries, scaleX, scaleRight, chartBottom)} fill="url(#terminalAreaRight)" />
            <path d={pathFor(rightSeries, scaleX, scaleRight)} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          </>
        )}

        <line x1={leftPad} y1={zeroBar} x2={width - rightPad} y2={zeroBar} stroke="rgba(226,232,240,0.9)" />
        <text x={leftPad} y={barTop - 12} fontSize="13" fill="#0f172a">{barLabel}</text>
        {bars.map((value, index) => {
          if (!Number.isFinite(value)) return null;
          const x = scaleX(index) - barWidth / 2;
          const y = Math.min(scaleBar(value), zeroBar);
          const h = Math.abs(scaleBar(value) - zeroBar);
          return <rect key={`bar-${index}`} x={x} y={y} width={barWidth} height={Math.max(h, 2)} rx="2" fill={value >= 0 ? positiveBar : negativeBar} />;
        })}

        {dates.map((date, index) => {
          if (!date || (index !== dates.length - 1 && index % step !== 0)) return null;
          return <text key={`date-${index}`} x={scaleX(index)} y={barTop + barHeight + 26} textAnchor="middle" fontSize="12" fill="#64748b">{fmtDate(date)}</text>;
        })}

        <rect
          x={leftPad}
          y={topPad}
          width={plotWidth}
          height={barTop + barHeight - topPad}
          fill="transparent"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const idx = Math.round(((x - leftPad) / plotWidth) * Math.max(total - 1, 1));
            if (idx < 0 || idx > current) {
              setHoverIndex(null);
              return;
            }
            setHoverIndex(idx);
          }}
        />

        {showTooltip && (
          <>
            <line x1={scaleX(tooltipIndex)} y1={topPad} x2={scaleX(tooltipIndex)} y2={barTop + barHeight} stroke="rgba(148,163,184,0.45)" strokeDasharray="4 6" />
            <g>
              <rect x={tooltipX - 86} y={tooltipY} rx="12" ry="12" width="172" height="66" fill="white" stroke="rgba(148,163,184,0.35)" />
              <text x={tooltipX} y={tooltipY + 20} textAnchor="middle" fontSize="12" fill="#0f172a">
                {fmtDate(hoverDate)}
              </text>
              {Number.isFinite(hoverPremium) && (
                <text x={tooltipX} y={tooltipY + 38} textAnchor="middle" fontSize="11" fill="#475569">
                  {barLabel}: {numberFmt(hoverPremium, 0)} VND
                </text>
              )}
              {Number.isFinite(hoverDomestic) && (
                <text x={tooltipX} y={tooltipY + 54} textAnchor="middle" fontSize="11" fill="#0f172a">
                  {leftLabel}: {leftKind === "vnd" ? numberFmt(hoverDomestic, 0) : numberFmt(hoverDomestic, 2)}
                </text>
              )}
            </g>
          </>
        )}

        <line x1={scaleX(current)} y1={topPad} x2={scaleX(current)} y2={barTop + barHeight} stroke="rgba(148,163,184,0.32)" strokeDasharray="4 6" />
      </svg>
    </div>
  );
};

const BuySellChart = ({
  dates,
  buySeries,
  sellSeries,
  label,
  unitLabel,
  loading,
  emptyText,
  range,
  setRange,
}) => {
  const [hoverState, setHoverState] = React.useState({ index: null, y: null });

  if (loading) {
    return <div className="flex h-[420px] items-center justify-center rounded-[24px] border border-slate-200 bg-white text-slate-500 shadow-sm">Loading buy/sell structure...</div>;
  }

  const sampled = sampleSeriesByRange({ dates, buySeries, sellSeries, range });
  const total = Math.max(sampled.dates.length, sampled.buySeries.length, sampled.sellSeries.length);
  const combined = [...(sampled.buySeries || []), ...(sampled.sellSeries || [])].filter((value) => Number.isFinite(value));
  if (total < 2 || !combined.length) {
    return <div className="flex h-[420px] items-center justify-center rounded-[24px] border border-slate-200 bg-white text-slate-500 shadow-sm">{emptyText}</div>;
  }

  const width = 1100;
  const height = 420;
  const leftPad = 88;
  const rightPad = 44;
  const topPad = 48;
  const bottomPad = 66;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;
  const priceRange = valueRange(combined);
  const step = total > 6 ? Math.ceil(total / 6) : 1;
  const scaleX = (index) => leftPad + (index * plotWidth) / Math.max(total - 1, 1);
  const scaleY = (value) => topPad + plotHeight - ((value - priceRange.min) * plotHeight) / Math.max(priceRange.max - priceRange.min, 1);
  const guideValues = Array.from({ length: 5 }, (_, line) => priceRange.max - ((priceRange.max - priceRange.min) * line) / 4);
  const lastBuy = lastFinite(sampled.buySeries);
  const lastSell = lastFinite(sampled.sellSeries);
  const latestIndex = total - 1;
  const hoverIndex = hoverState.index != null ? Math.max(0, Math.min(latestIndex, hoverState.index)) : null;
  const hoverDate = hoverIndex != null ? sampled.dates[hoverIndex] : null;
  const hoverBuy = hoverIndex != null ? sampled.buySeries[hoverIndex] : null;
  const hoverSell = hoverIndex != null ? sampled.sellSeries[hoverIndex] : null;
  const hoverX = hoverIndex != null ? scaleX(hoverIndex) : null;
  const hoverY = hoverState.y != null ? Math.min(Math.max(hoverState.y, topPad), topPad + plotHeight) : null;
  const tooltipX = hoverX != null ? Math.min(Math.max(hoverX, leftPad + 90), width - rightPad - 90) : null;
  const tooltipY = topPad + 10;
  const showTooltip = hoverIndex != null;

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Buy / Sell Price Chart</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">{label}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map(([value, optionLabel]) => (
            <button key={value} onClick={() => setRange(value)} className={`rounded-xl border px-4 py-2 text-sm font-medium ${range === value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`} type="button">
              {optionLabel}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-blue-600">Buy</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{numberFmt(lastBuy, unitLabel === "USD" ? 2 : 0)} {unitLabel}</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-red-600">Sell</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">{numberFmt(lastSell, unitLabel === "USD" ? 2 : 0)} {unitLabel}</p>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[420px] w-full">
        {guideValues.map((guide) => (
          <g key={guide}>
            <line x1={leftPad} y1={scaleY(guide)} x2={width - rightPad} y2={scaleY(guide)} stroke="rgba(148,163,184,0.18)" />
            <text x={leftPad - 14} y={scaleY(guide) + 4} textAnchor="end" fontSize="12" fill="#64748b">
              {unitLabel === "USD" ? numberFmt(guide, 2) : compactFmt(guide)}
            </text>
          </g>
        ))}

        <line x1={leftPad} y1={topPad} x2={leftPad} y2={height - bottomPad} stroke="rgba(100,116,139,0.36)" />
        <line x1={leftPad} y1={height - bottomPad} x2={width - rightPad} y2={height - bottomPad} stroke="rgba(100,116,139,0.36)" />

        <text x="20" y={topPad + plotHeight / 2} fontSize="12" fill="#64748b" transform={`rotate(-90 20 ${topPad + plotHeight / 2})`}>
          Price ({unitLabel})
        </text>
        <text x={width / 2} y={height - 18} textAnchor="middle" fontSize="12" fill="#64748b">
          Time
        </text>

        <path d={pathFor(sampled.buySeries, scaleX, scaleY)} fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" />
        <path d={pathFor(sampled.sellSeries, scaleX, scaleY)} fill="none" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" />

        {sampled.buySeries.map((value, index) => {
          if (!Number.isFinite(value)) return null;
          return <circle key={`buy-dot-${index}`} cx={scaleX(index)} cy={scaleY(value)} r="3.2" fill="#2563eb" />;
        })}
        {sampled.sellSeries.map((value, index) => {
          if (!Number.isFinite(value)) return null;
          return <circle key={`sell-dot-${index}`} cx={scaleX(index)} cy={scaleY(value)} r="3.2" fill="#dc2626" />;
        })}

        <rect
          x={leftPad}
          y={topPad}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          onMouseLeave={() => setHoverState({ index: null, y: null })}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const idx = Math.round(((x - leftPad) / plotWidth) * Math.max(total - 1, 1));
            if (idx < 0 || idx > latestIndex) {
              setHoverState({ index: null, y: null });
              return;
            }
            setHoverState({ index: idx, y });
          }}
        />

        {showTooltip && hoverX != null && hoverY != null && (
          <>
            <line x1={hoverX} y1={topPad} x2={hoverX} y2={topPad + plotHeight} stroke="rgba(148,163,184,0.45)" strokeDasharray="4 6" />
            <line x1={leftPad} y1={hoverY} x2={width - rightPad} y2={hoverY} stroke="rgba(148,163,184,0.35)" strokeDasharray="4 6" />
            <g>
              <rect x={tooltipX - 90} y={tooltipY} rx="12" ry="12" width="180" height="70" fill="white" stroke="rgba(148,163,184,0.35)" />
              <text x={tooltipX} y={tooltipY + 20} textAnchor="middle" fontSize="12" fill="#0f172a">
                {fmtDate(hoverDate)}
              </text>
              {Number.isFinite(hoverBuy) && (
                <text x={tooltipX} y={tooltipY + 40} textAnchor="middle" fontSize="11" fill="#1d4ed8">
                  Buy: {numberFmt(hoverBuy, unitLabel === "USD" ? 2 : 0)} {unitLabel}
                </text>
              )}
              {Number.isFinite(hoverSell) && (
                <text x={tooltipX} y={tooltipY + 56} textAnchor="middle" fontSize="11" fill="#b91c1c">
                  Sell: {numberFmt(hoverSell, unitLabel === "USD" ? 2 : 0)} {unitLabel}
                </text>
              )}
            </g>
          </>
        )}

        {sampled.dates.map((date, index) => {
          if (!date || (index !== sampled.dates.length - 1 && index % step !== 0)) return null;
          return (
            <text key={`tick-${index}`} x={scaleX(index)} y={height - bottomPad + 24} textAnchor="middle" fontSize="12" fill="#64748b">
              {fmtDate(date)}
            </text>
          );
        })}

        {range === "1w" && sampled.buySeries.map((value, index) => {
          if (!Number.isFinite(value)) return null;
          return (
            <text key={`buy-label-${index}`} x={scaleX(index)} y={scaleY(value) - 10} textAnchor="middle" fontSize="11" fill="#1d4ed8">
              {numberFmt(value, unitLabel === "USD" ? 2 : 0)}
            </text>
          );
        })}

        {range === "1w" && sampled.sellSeries.map((value, index) => {
          if (!Number.isFinite(value)) return null;
          return (
            <text key={`sell-label-${index}`} x={scaleX(index)} y={scaleY(value) + 18} textAnchor="middle" fontSize="11" fill="#b91c1c">
              {numberFmt(value, unitLabel === "USD" ? 2 : 0)}
            </text>
          );
        })}

        {Number.isFinite(lastBuy) && (
          <>
            <circle cx={scaleX(latestIndex)} cy={scaleY(lastBuy)} r="5" fill="#2563eb" />
            <text x={scaleX(latestIndex) - 10} y={scaleY(lastBuy) - 12} textAnchor="end" fontSize="12" fill="#1d4ed8">
              {numberFmt(lastBuy, unitLabel === "USD" ? 2 : 0)}
            </text>
          </>
        )}
        {Number.isFinite(lastSell) && (
          <>
            <circle cx={scaleX(latestIndex)} cy={scaleY(lastSell)} r="5" fill="#dc2626" />
            <text x={scaleX(latestIndex) - 10} y={scaleY(lastSell) + 18} textAnchor="end" fontSize="12" fill="#b91c1c">
              {numberFmt(lastSell, unitLabel === "USD" ? 2 : 0)}
            </text>
          </>
        )}
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-600" />Buy</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-600" />Sell</span>
      </div>
    </div>
  );
};

const MarketInsightsPage = ({ styles, headerRole = "GUEST" }) => {
  const navigate = useNavigate();
  const isLoggedIn = headerRole !== "GUEST" || Boolean(localStorage.getItem("accessToken"));
  const [displayMode, setDisplayMode] = React.useState("local");
  const {
    activeTab,
    setActiveTab,
    range,
    setRange,
    isLoading,
    error,
    reload,
    apiErrors,
    goldMarket,
    silverMarket,
    forexMarket,
  } = useMarketInsights();

  const market = activeTab === "GOLD" ? goldMarket : activeTab === "SILVER" ? silverMarket : forexMarket;
  const meta = META[activeTab];

  React.useEffect(() => {
    if (activeTab === "FOREX") setDisplayMode("local");
  }, [activeTab]);

  const fxValues = (market?.series?.values || []).filter((value) => Number.isFinite(value));
  const fxRange = fxValues.length ? Math.max(...fxValues) - Math.min(...fxValues) : 0;

  const metrics = activeTab === "FOREX"
    ? [
        ["USD/VND Rate", `${numberFmt(market.latestDomesticSell, 0)}`, "Tracked from local FX history", market.domesticChangeLocal],
        ["Weekly Change", signedPct(market.worldChangeLocal), "Short-term trend from current range", market.worldChangeLocal],
        ["Session Range", `${numberFmt(fxRange, 0)} VND`, "High-low spread in selected range", market.premiumChange],
        ["Signal", market.domesticChangeLocal >= 0 ? "USD Firm" : "VND Firm", "Derived from latest momentum", market.domesticChangeLocal],
        ["Correlation", numberFmt(market.correlation, 2), "Self-tracked FX benchmark", null],
      ]
    : [
        [
          meta.localLabel,
          displayMode === "local" ? `${numberFmt(market.latestDomesticSell, 0)} VND` : `${numberFmt(lastFinite(market.series.domesticSellUsd), 2)} USD`,
          displayMode === "local" ? `Primary domestic track in VND / ${meta.unit}` : "Domestic price implied back to USD/oz",
          displayMode === "local" ? market.domesticChangeLocal : market.domesticChangeUsd,
        ],
        [
          "International Spot",
          displayMode === "local" ? `${numberFmt(market.latestWorldLocal, 0)} VND` : `${numberFmt(market.latestWorldUsd, 2)} USD`,
          displayMode === "local" ? `Converted benchmark aligned to ${meta.unit}` : "Native spot quotation in USD/oz",
          displayMode === "local" ? market.worldChangeLocal : market.worldChangeUsd,
        ],
        ["Spread", `${numberFmt(market.latestPremium, 0)} VND`, "Local premium over converted world benchmark", market.premiumChange],
        ["USD/VND Rate", `${numberFmt(market.latestExchangeRate, 0)}`, "Cross-rate used in all local conversions", null],
        ["Correlation (1M)", numberFmt(market.correlation, 2), "Domestic vs converted international movement", null],
      ];

  const chart = activeTab === "FOREX"
    ? {
        leftSeries: market.series.values || [],
        rightSeries: [],
        leftLabel: "USD/VND",
        rightLabel: "",
        leftKind: "fx",
        rightKind: "fx",
        bars: market.series.momentum || [],
        barLabel: meta.premiumLabel,
        empty: "No FX points available from API yet.",
      }
    : displayMode === "international"
      ? {
          leftSeries: market.series.domesticSellUsd || [],
          rightSeries: market.series.worldUsd || [],
          leftLabel: `${meta.localLabel} (USD/oz implied)`,
          rightLabel: `${meta.benchmarkLabel} (USD/oz)`,
          leftKind: "usd",
          rightKind: "usd",
          bars: market.series.premium || [],
          barLabel: meta.premiumLabel,
          empty: "No international comparison points available from API yet.",
        }
      : {
          leftSeries: market.series.domesticSellLocal || [],
          rightSeries: market.series.worldLocal || [],
          leftLabel: `${meta.localLabel} (VND/${meta.unitShort})`,
          rightLabel: `${meta.benchmarkLabel} (VND/${meta.unitShort}, converted)`,
          leftKind: "vnd",
          rightKind: "vnd",
          bars: market.series.premium || [],
          barLabel: meta.premiumLabel,
          empty: "No domestic comparison points available from API yet.",
        };

  const isInternationalView = activeTab !== "FOREX" && displayMode === "international";
  const dualAxisDescription =
    activeTab === "FOREX"
      ? "Forex uses one main rate series, so the comparison chart does not need two separate value axes."
      : "Dual Y-Axis uses one vertical axis for the domestic line and another for the international benchmark so both series stay readable even when their scales differ.";
  const buySellChart = activeTab === "FOREX"
    ? {
        buySeries: market.series.values || [],
        sellSeries: market.series.values || [],
        label: "USD/VND Live Price Structure",
        unitLabel: "VND",
        empty: "No FX buy/sell history available from API yet.",
      }
    : displayMode === "international"
      ? {
          buySeries: market.series.domesticBuyUsd || [],
          sellSeries: market.series.domesticSellUsd || [],
          label: `${meta.localLabel} Buy / Sell (${meta.unit} implied to USD/oz)`,
          unitLabel: "USD",
          empty: "No implied USD buy/sell points available from API yet.",
        }
      : {
          buySeries: market.series.domesticBuyLocal || [],
          sellSeries: market.series.domesticSellLocal || [],
          label: `${meta.localLabel} Buy / Sell (${meta.unit})`,
          unitLabel: "VND",
          empty: "No local buy/sell points available from API yet.",
        };

  return (
    <div className={styles.pageWrapper}>
      <Header role={headerRole} />

      <main className={styles.dashboardContainer}>
        <div className={styles.tabContainer}>
          {["GOLD", "SILVER", "FOREX"].map((tab) => (
            <button key={tab} className={`${styles.tabBtn} ${activeTab === tab ? styles.activeTab : ""}`} onClick={() => setActiveTab(tab)} type="button">
              {tab}
            </button>
          ))}
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        {!error && (apiErrors?.international || apiErrors?.exchange) && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Market Insight is showing partial data. FE still depends on BE for international quotes and FX conversion history.
          </div>
        )}

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900">
            <div className="grid xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="border-b border-slate-200 px-6 py-6 xl:border-b-0 xl:border-r xl:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Market Insight Board</p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">{meta.title}</h2>
                  </div>
                  {activeTab !== "FOREX" && (
                    <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                      <button onClick={() => setDisplayMode("local")} className={`rounded-lg px-4 py-2 text-sm font-medium ${displayMode === "local" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`} type="button">Vietnam</button>
                      <button onClick={() => setDisplayMode("international")} className={`rounded-lg px-4 py-2 text-sm font-medium ${displayMode === "international" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`} type="button">International</button>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6 2xl:grid-cols-10">
                  {metrics.map(([label, value, subtext, change], index) => (
                    <div
                      key={label}
                      className={`rounded-[24px] border px-5 py-5 shadow-sm transition-colors ${
                        index === 0
                          ? "border-emerald-200 bg-emerald-50/85"
                          : index === 1
                            ? "border-sky-200 bg-sky-50/85"
                            : index === 2
                              ? "border-rose-200 bg-rose-50/75"
                              : "border-slate-200 bg-white"
                      } ${
                        isInternationalView && index < 2
                          ? "xl:col-span-3 2xl:col-span-3 min-h-[208px]"
                          : "xl:col-span-2 2xl:col-span-2"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                        {change == null ? null : <span className={`mt-1 text-xs font-semibold ${change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-600" : "text-slate-500"}`}>{signedPct(change)}</span>}
                      </div>
                      <div className="mt-3">
                        <p className={`${isInternationalView && index < 2 ? "text-[2.9rem] leading-[1.02]" : "text-[2rem] leading-tight"} font-semibold tracking-[-0.03em] text-slate-950`}>
                          {value}
                        </p>
                      </div>
                      <div className={`mt-4 h-px w-full ${index === 0 ? "bg-emerald-200" : index === 1 ? "bg-sky-200" : index === 2 ? "bg-rose-200" : "bg-slate-200"}`} />
                      <p className="mt-4 max-w-[28ch] text-sm leading-6 text-slate-500">{subtext}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {RANGE_OPTIONS.map(([value, label]) => (
                      <button key={value} onClick={() => setRange(value)} className={`rounded-xl border px-4 py-2 text-sm font-medium ${range === value ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`} type="button">
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative group">
                      <button type="button" aria-label="Explain Dual Y-Axis" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-700">
                        <span>Dual Y-Axis</span>
                        
                      </button>
                      <div className="pointer-events-none absolute right-0 top-12 z-10 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)] transition-opacity duration-150 group-hover:opacity-100">
                        <p className="font-semibold text-slate-900">Dual Y-Axis</p>
                        <p className="mt-1">{dualAxisDescription}</p>
                      </div>
                    </div>
                    <button onClick={reload} type="button" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"><RefreshCcw className="h-4 w-4" />Refresh</button>
                  </div>
                </div>

                <div className="mt-5">
                  <ChartPanel
                    dates={market?.series?.dates || []}
                    leftSeries={chart.leftSeries}
                    rightSeries={chart.rightSeries}
                    bars={chart.bars}
                    leftLabel={chart.leftLabel}
                    rightLabel={chart.rightLabel}
                    leftKind={chart.leftKind}
                    rightKind={chart.rightKind}
                    barLabel={chart.barLabel}
                    loading={isLoading}
                    emptyText={chart.empty}
                    activeTab={activeTab}
                  />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"><Globe2 className="h-3.5 w-3.5" />{activeTab === "FOREX" ? "FX chart uses current USD/VND series from BE history" : `Converted benchmark uses USD/VND and ${meta.unit.toLowerCase()} conversion`}</span>
                  {activeTab !== "FOREX" && <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] ${riskTone(market.risk)}`}><Scale className="h-3.5 w-3.5" />{market.risk} premium risk</span>}
                </div>
              </div>

              <div className="border-t border-slate-200 xl:border-t-0">
                <div className="flex h-full flex-col px-5 py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">News Feed</p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-900">Market Follow-up</h3>
                    </div>
                    <Newspaper className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-5 space-y-4">
                    {NEWS[activeTab].map(([title, age]) => (
                      <article key={title} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm">
                        <p className="text-sm font-semibold leading-6 text-slate-900">{title}</p>
                        <p className="mt-2 text-xs text-slate-500">{age}</p>
                      </article>
                    ))}
                  </div>
                  <p className="mt-auto pt-4 text-xs leading-5 text-slate-500">Feed is mocked from FE until BE provides a dedicated market insight news source.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={`${styles.sectionContainer} mt-8`}>
          <BuySellChart
            dates={market?.series?.dates || []}
            buySeries={buySellChart.buySeries}
            sellSeries={buySellChart.sellSeries}
            label={buySellChart.label}
            unitLabel={buySellChart.unitLabel}
            loading={isLoading}
            emptyText={buySellChart.empty}
            range={range}
            setRange={setRange}
          />
        </div>

        <div className={styles.ctaBox}>
          {isLoggedIn ? (
            <>
              <h2 className={styles.ctaTitle}>Move From Market Signals To Portfolio Tracking</h2>
              <p className={styles.ctaDesc}>Review your holdings, compare entry price against the latest market moves, and decide where to rebalance next.</p>
              <button className={styles.ctaBtn} onClick={() => navigate("/portfolio")} type="button">Open Portfolio Tracking</button>
            </>
          ) : (
            <>
              <h2 className={styles.ctaTitle}>Unlock Advanced Insights & Portfolio Tracking</h2>
              <p className={styles.ctaDesc}>Track your precious metals portfolio, simulate investments, and get personalized analytics.</p>
              <button className={styles.ctaBtn} onClick={() => navigate("/login")} type="button">Login or Register to Get Started</button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketInsightsPage;
