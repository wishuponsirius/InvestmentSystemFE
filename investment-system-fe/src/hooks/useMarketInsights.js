import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMarketInsights } from "../services/marketInsightsService";

const getDelta = (series) => {
  if (!Array.isArray(series) || series.length < 2) return 0;
  const prev = Number(series[series.length - 2] || 0);
  const curr = Number(series[series.length - 1] || 0);
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
};

const toChartSeries = (alignedSeries, spread = 0) => {
  const buy = [];
  const sell = [];
  const world = [];

  let lastSell = null;
  let lastWorld = null;

  for (const item of alignedSeries || []) {
    if (item?.domesticSell && item.domesticSell > 0) lastSell = item.domesticSell;
    if (item?.worldVnd && item.worldVnd > 0) lastWorld = item.worldVnd;

    if (lastSell != null) {
      sell.push(lastSell / 1000000);
      buy.push((lastSell - spread) / 1000000);
    }

    if (lastWorld != null) world.push(lastWorld);

    if (lastSell != null && lastWorld == null) world.push(0);
    if (lastWorld != null && lastSell == null) {
      sell.push(0);
      buy.push(0);
    }
  }

  return { buy, sell, world };
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

    const sjc =
      productsGold.find((x) => String(x.type).toUpperCase().includes("SJC")) || productsGold[0] || null;
    const silverBase = productsSilver[0] || null;

    const goldSpread = sjc ? Math.max(0, sjc.sell - sjc.buy) : 0;
    const silverSpread = silverBase ? Math.max(0, silverBase.sell - silverBase.buy) : 0;

    const goldSeries = toChartSeries(data?.goldSeries || [], goldSpread);
    const silverSeries = toChartSeries(data?.silverSeries || [], silverSpread);
    const currencySeries = (data?.currencySeries || []).map((x) => Number(x?.value || 0));

    const goldDomesticChange = getDelta(goldSeries.sell);
    const goldWorldChange = getDelta(goldSeries.world);
    const silverDomesticChange = getDelta(silverSeries.sell);
    const silverWorldChange = getDelta(silverSeries.world);
    const currencyChange = getDelta(currencySeries);

    const worldGoldVnd = Number(data?.worldGoldVnd || 0);
    const worldSilverVnd = Number(data?.worldSilverVnd || 0);

    const goldSpreadGap = Math.abs((sjc?.sell || 0) - worldGoldVnd);
    const goldRisk = goldSpreadGap > 1500000 ? "High" : goldSpreadGap > 500000 ? "Medium" : "Low";

    const silverSpreadGap = Math.abs((silverBase?.sell || 0) - worldSilverVnd);
    const silverRisk = silverSpreadGap > 1000000 ? "High" : "Low";

    return {
      sjc,
      silverBase,
      productsGold,
      productsSilver,
      usdToVnd: Number(data?.usdToVnd || 0),
      worldGoldUsd: Number(data?.worldGoldUsd || 0),
      worldSilverUsd: Number(data?.worldSilverUsd || 0),
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
