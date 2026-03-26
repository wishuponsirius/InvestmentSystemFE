import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMarketInsights } from "../services/marketInsightsService";

const getDelta = (series) => {
  if (!Array.isArray(series) || series.length < 2) return 0;

  const numeric = series.filter((value) => Number.isFinite(value));
  if (numeric.length < 2) return 0;

  const prev = Number(numeric[numeric.length - 2] || 0);
  const curr = Number(numeric[numeric.length - 1] || 0);
  if (!prev) return 0;

  return ((curr - prev) / prev) * 100;
};

const lastFinite = (series, fallback = 0) => {
  if (!Array.isArray(series)) return fallback;

  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(series[index])) return series[index];
  }

  return fallback;
};

const calcCorrelation = (seriesA, seriesB) => {
  const pairs = [];

  for (let index = 0; index < Math.max(seriesA.length, seriesB.length); index += 1) {
    const a = seriesA[index];
    const b = seriesB[index];
    if (Number.isFinite(a) && Number.isFinite(b)) {
      pairs.push([a, b]);
    }
  }

  if (pairs.length < 3) return 0;

  const meanA = pairs.reduce((sum, [value]) => sum + value, 0) / pairs.length;
  const meanB = pairs.reduce((sum, [, value]) => sum + value, 0) / pairs.length;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (const [a, b] of pairs) {
    const diffA = a - meanA;
    const diffB = b - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denominator = Math.sqrt(denomA * denomB);
  if (!denominator) return 0;

  return numerator / denominator;
};

const classifyRisk = (asset, premium) => {
  if (asset === "gold") {
    if (premium > 18000000) return "Extreme";
    if (premium > 12000000) return "High";
    if (premium > 5000000) return "Medium";
    return "Low";
  }

  if (asset === "silver") {
    if (premium > 8000000) return "High";
    if (premium > 3000000) return "Medium";
    return "Low";
  }

  return "Low";
};

const buildMetalSeries = (rows) => {
  const dates = [];
  const domesticBuyLocal = [];
  const domesticSellLocal = [];
  const domesticBuyUsd = [];
  const domesticSellUsd = [];
  const worldUsd = [];
  const worldBuyUsd = [];
  const worldSellUsd = [];
  const worldLocal = [];
  const worldBuyLocal = [];
  const worldSellLocal = [];
  const premium = [];
  const exchangeRate = [];

  for (const item of rows || []) {
    dates.push(item?.at ?? null);
    domesticBuyLocal.push(Number.isFinite(item?.domesticBuy) ? item.domesticBuy : null);
    domesticSellLocal.push(Number.isFinite(item?.domesticSell) ? item.domesticSell : null);
    domesticBuyUsd.push(Number.isFinite(item?.domesticBuyUsd) ? item.domesticBuyUsd : null);
    domesticSellUsd.push(Number.isFinite(item?.domesticSellUsd) ? item.domesticSellUsd : null);
    worldUsd.push(Number.isFinite(item?.worldUsd) ? item.worldUsd : null);
    worldBuyUsd.push(Number.isFinite(item?.worldBuyUsd) ? item.worldBuyUsd : null);
    worldSellUsd.push(Number.isFinite(item?.worldSellUsd) ? item.worldSellUsd : null);
    worldLocal.push(Number.isFinite(item?.worldLocalVnd) ? item.worldLocalVnd : null);
    worldBuyLocal.push(Number.isFinite(item?.worldBuyLocalVnd) ? item.worldBuyLocalVnd : null);
    worldSellLocal.push(Number.isFinite(item?.worldSellLocalVnd) ? item.worldSellLocalVnd : null);
    exchangeRate.push(Number.isFinite(item?.exchangeRate) ? item.exchangeRate : null);

    if (Number.isFinite(item?.domesticSell) && Number.isFinite(item?.worldLocalVnd)) {
      premium.push(item.domesticSell - item.worldLocalVnd);
    } else {
      premium.push(null);
    }
  }

  return {
    dates,
    domesticBuyLocal,
    domesticSellLocal,
    domesticBuyUsd,
    domesticSellUsd,
    worldUsd,
    worldBuyUsd,
    worldSellUsd,
    worldLocal,
    worldBuyLocal,
    worldSellLocal,
    premium,
    exchangeRate,
  };
};

const buildForexSeries = (rows) => {
  const dates = [];
  const values = [];
  const momentum = [];

  for (const item of rows || []) {
    const value = Number.isFinite(item?.value) ? item.value : null;
    dates.push(item?.at ?? null);
    values.push(value);
  }

  values.forEach((value, index) => {
    const prev = index > 0 ? values[index - 1] : null;
    if (Number.isFinite(value) && Number.isFinite(prev) && prev !== 0) {
      momentum.push(((value - prev) / prev) * 100);
    } else {
      momentum.push(0);
    }
  });

  return { dates, values, momentum };
};

const buildMetalMarket = ({
  key,
  product,
  products,
  rows,
  latestWorldUsd,
  latestWorldLocal,
  latestPremium,
  usdToVnd,
}) => {
  const series = buildMetalSeries(rows);
  const premiumLatest = lastFinite(series.premium, latestPremium);

  return {
    key,
    product,
    products,
    latestDomesticBuy: product?.buy || 0,
    latestDomesticSell: product?.sell || 0,
    latestWorldUsd: Number(latestWorldUsd || 0),
    latestWorldLocal: Number(latestWorldLocal || 0),
    latestPremium: premiumLatest,
    latestExchangeRate: Number(usdToVnd || 0),
    domesticChangeLocal: getDelta(series.domesticSellLocal),
    domesticChangeUsd: getDelta(series.domesticSellUsd),
    worldChangeLocal: getDelta(series.worldLocal),
    worldChangeUsd: getDelta(series.worldUsd),
    premiumChange: getDelta(series.premium),
    correlation: calcCorrelation(series.domesticSellLocal, series.worldLocal),
    risk: classifyRisk(key, premiumLatest),
    series,
  };
};

const buildForexMarket = (rows, usdToVnd) => {
  const series = buildForexSeries(rows);
  const latestRate = lastFinite(series.values, usdToVnd);

  return {
    key: "forex",
    product: {
      provider: "VN",
      type: "USD / VND",
      buy: latestRate,
      sell: latestRate,
      spread: 0,
      localUnit: "Currency Unit",
      worldUnit: "Currency Unit",
    },
    products: [
      {
        provider: "VN",
        type: "USD / VND",
        buy: latestRate,
        sell: latestRate,
        spread: 0,
        localUnit: "Currency Unit",
        worldUnit: "Currency Unit",
      },
    ],
    latestDomesticBuy: latestRate,
    latestDomesticSell: latestRate,
    latestWorldUsd: 1,
    latestWorldLocal: latestRate,
    latestPremium: 0,
    latestExchangeRate: latestRate,
    domesticChangeLocal: getDelta(series.values),
    domesticChangeUsd: getDelta(series.values),
    worldChangeLocal: getDelta(series.values),
    worldChangeUsd: getDelta(series.values),
    premiumChange: getDelta(series.momentum),
    correlation: 1,
    risk: "Low",
    series,
  };
};

export const useMarketInsights = () => {
  const [activeTab, setActiveTab] = useState("GOLD");
  const [range, setRange] = useState("1m");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await fetchMarketInsights(range);
      setData(result);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Cannot load market insights.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const computed = useMemo(() => {
    const productsGold = data?.productsGold || [];
    const productsSilver = data?.productsSilver || [];

    const goldProduct = productsGold[0] || null;
    const silverProduct = productsSilver[0] || null;
    const usdToVnd = Number(data?.usdToVnd || 0);

    return {
      usdToVnd,
      apiErrors: data?.apiErrors || {},
      goldMarket: buildMetalMarket({
        key: "gold",
        product: goldProduct,
        products: productsGold,
        rows: data?.goldSeries || [],
        latestWorldUsd: data?.worldGoldUsd || 0,
        latestWorldLocal: data?.worldGoldVnd || 0,
        latestPremium: data?.goldPremium || 0,
        usdToVnd,
      }),
      silverMarket: buildMetalMarket({
        key: "silver",
        product: silverProduct,
        products: productsSilver,
        rows: data?.silverSeries || [],
        latestWorldUsd: data?.worldSilverUsd || 0,
        latestWorldLocal: data?.worldSilverVnd || 0,
        latestPremium: data?.silverPremium || 0,
        usdToVnd,
      }),
      forexMarket: buildForexMarket(data?.currencySeries || [], usdToVnd),
    };
  }, [data]);

  return {
    activeTab,
    setActiveTab,
    range,
    setRange,
    isLoading,
    error,
    reload: load,
    ...computed,
  };
};
