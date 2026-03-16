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
  const worldBuy = [];
  const worldSell = [];
  const dates = [];

  let lastSell = null;
  let lastWorld = null;
  let lastWorldBuy = null;
  let lastWorldSell = null;

  for (const item of alignedSeries || []) {

    dates.push(item?.at ?? null);
    
    if (Number.isFinite(item?.domesticSell) && item.domesticSell > 0) {
      lastSell = item.domesticSell / 1000000;
    }

    if (Number.isFinite(item?.worldVnd) && item.worldVnd > 0) {
      lastWorld = item.worldVnd;
    }

    if (Number.isFinite(item?.worldBuyVnd) && item.worldBuyVnd > 0) {
      lastWorldBuy = item.worldBuyVnd;
    }

    if (Number.isFinite(item?.worldSellVnd) && item.worldSellVnd > 0) {
      lastWorldSell = item.worldSellVnd;
    }

    sell.push(lastSell);
    buy.push(lastSell != null ? lastSell - spread / 1000000 : null);

    world.push(lastWorld);
    worldBuy.push(lastWorldBuy);
    worldSell.push(lastWorldSell);
  }

  return { buy, sell, world, worldBuy, worldSell, dates };
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

    const goldSpreadGap = Number(data?.goldPremium || 0);
    // NEW 2026 Thresholds for Gold (VND/lượng)
    const goldRisk = 
      goldSpreadGap > 18000000 ? "Extreme" : // Above 18M: Bubble territory
      goldSpreadGap > 12000000 ? "High" :    // 12M - 18M: High scarcity/intervention risk
      goldSpreadGap > 5000000  ? "Medium" :  // 5M - 12M: Standard market premium
      "Low";                                 // Below 5M: Very stable (rare in 2026)

    const silverSpreadGap = Number(data?.silverPremium || 0);
    // NEW 2026 Thresholds for Silver (VND/kg)
    const silverRisk = 
      silverSpreadGap > 8000000 ? "High" :   // High speculative gap
      silverSpreadGap > 3000000 ? "Medium" : // Healthy industrial/investment demand
      "Low";

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
