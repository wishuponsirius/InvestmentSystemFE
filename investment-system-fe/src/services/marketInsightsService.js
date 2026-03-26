import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const TROY_OUNCE_GRAMS = 31.1034768;
const GOLD_LUONG_GRAMS = 37.5;
const OUNCES_PER_LUONG = GOLD_LUONG_GRAMS / TROY_OUNCE_GRAMS;
const OUNCES_PER_KG = 1000 / TROY_OUNCE_GRAMS;
const RANGE_REQUEST_MAP = {
  "6m": "1y",
};

let lastInternational = null;
let lastExchangeRate = 24000;

const ASSET_META = {
  gold: {
    localLabel: "SJC Gold",
    localUnit: "Luong",
    globalUnit: "Ounce",
    worldToLocalFactor: OUNCES_PER_LUONG,
  },
  silver: {
    localLabel: "Phu Quy Silver",
    localUnit: "Kg",
    globalUnit: "Ounce",
    worldToLocalFactor: OUNCES_PER_KG,
  },
};

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toDate = (value) => {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getDateKey = (item) => {
  const raw = item?.timestamp || item?.updateDate || item?.update_date;
  if (!raw) return "";
  const date = toDate(raw);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
};

const getBackendHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const backendGet = async (path) => {
  const headers = getBackendHeaders();
  const response = await backendApi.get(path, { headers });
  return response.data;
};

const tryBackendGet = async (path) => {
  try {
    const data = await backendGet(path);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error, data: null };
  }
};

const tryBackendGetMany = async (paths) => {
  let lastError = null;

  for (const path of paths) {
    const result = await tryBackendGet(path);
    if (result.ok) return result;
    lastError = result.error;
  }

  return { ok: false, error: lastError, data: null };
};

const fetchPremium = async () => {
  const res = await tryBackendGet("/prices/premium");
  if (!res.ok) return [];
  return res.data || [];
};

const pickLatest = (rows) => (Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null);

const normalizeDomesticGoldVnd = (value) => {
  if (value <= 0) return value;

  let normalized = value;
  while (normalized > 500000000) {
    normalized /= 10;
  }
  while (normalized < 1000000) {
    normalized *= 1000000;
  }
  return normalized;
};

const normalizeDomesticValue = (asset, value) => {
  if (asset === "gold") return normalizeDomesticGoldVnd(value);
  return value;
};

const convertUsdPerOunceToLocalVnd = (asset, usdPerOunce, usdToVnd) => {
  const meta = ASSET_META[asset];
  if (!meta || usdPerOunce <= 0 || usdToVnd <= 0) return 0;
  return usdPerOunce * usdToVnd * meta.worldToLocalFactor;
};

const convertLocalVndToUsdPerOunce = (asset, localVnd, usdToVnd) => {
  const meta = ASSET_META[asset];
  if (!meta || localVnd <= 0 || usdToVnd <= 0) return 0;
  return localVnd / usdToVnd / meta.worldToLocalFactor;
};

const mapBackendProduct = (asset, latestRow) => {
  if (!latestRow) return [];

  const buy = normalizeDomesticValue(asset, toNumber(latestRow?.buyPrice ?? latestRow?.buy));
  const sell = normalizeDomesticValue(asset, toNumber(latestRow?.sellPrice ?? latestRow?.sell));
  if (buy <= 0 || sell <= 0) return [];

  const meta = ASSET_META[asset];
  const updated = latestRow?.timestamp || latestRow?.updateDate || "";

  return [
    {
      provider: "VN",
      type: meta.localLabel,
      buy,
      sell,
      spread: Math.max(0, sell - buy),
      updated,
      category: asset,
      localUnit: meta.localUnit,
      worldUnit: meta.globalUnit,
    },
  ];
};

const trimSeriesToRange = (series, range) => {
  if (!Array.isArray(series) || !series.length || range !== "6m") return series;

  const lastAt = series[series.length - 1]?.at;
  if (!(lastAt instanceof Date) || Number.isNaN(lastAt.getTime())) return series;

  const cutoff = new Date(lastAt);
  cutoff.setMonth(cutoff.getMonth() - 6);
  const trimmed = series.filter((item) => item?.at instanceof Date && item.at >= cutoff);
  return trimmed.length ? trimmed : series;
};

const alignSeries = ({ asset, vnRows, globalRows, currencyRows, usdToVnd }) => {
  const historicalRates = {};
  const currencySeries = [];

  for (const item of currencyRows || []) {
    const key = getDateKey(item);
    if (!key) continue;

    const sell = toNumber(item?.sellPrice ?? item?.sell ?? item?.sell_price);
    if (sell <= 0) continue;

    historicalRates[key] = sell;
    currencySeries.push({
      at: toDate(item?.timestamp || item?.updateDate || item?.update_date),
      value: sell,
    });
  }

  currencySeries.sort((a, b) => a.at - b.at);
  const aligned = {};

  for (const item of vnRows || []) {
    const key = getDateKey(item);
    if (!key) continue;

    const domesticBuy = normalizeDomesticValue(
      asset,
      toNumber(item?.buyPrice ?? item?.buy ?? item?.buy_price),
    );
    const domesticSell = normalizeDomesticValue(
      asset,
      toNumber(item?.sellPrice ?? item?.sell ?? item?.sell_price),
    );

    if (domesticSell <= 0 && domesticBuy <= 0) continue;

    aligned[key] = {
      at: toDate(item?.timestamp || item?.updateDate || item?.update_date),
      domesticBuy: domesticBuy > 0 ? domesticBuy : aligned[key]?.domesticBuy ?? null,
      domesticSell: domesticSell > 0 ? domesticSell : aligned[key]?.domesticSell ?? null,
      worldUsd: aligned[key]?.worldUsd ?? null,
      worldBuyUsd: aligned[key]?.worldBuyUsd ?? null,
      worldSellUsd: aligned[key]?.worldSellUsd ?? null,
    };
  }

  for (const item of globalRows || []) {
    const key = getDateKey(item);
    if (!key) continue;

    const worldBuyUsd = toNumber(item?.buyPrice ?? item?.buy ?? item?.buy_price ?? item?.price);
    const worldSellUsd = toNumber(item?.sellPrice ?? item?.sell ?? item?.sell_price);
    const worldUsd = worldSellUsd > 0 ? worldSellUsd : worldBuyUsd;
    if (worldUsd <= 0) continue;

    aligned[key] = {
      at: aligned[key]?.at || toDate(item?.timestamp || item?.updateDate || item?.update_date),
      domesticBuy: aligned[key]?.domesticBuy ?? null,
      domesticSell: aligned[key]?.domesticSell ?? null,
      worldUsd,
      worldBuyUsd: worldBuyUsd > 0 ? worldBuyUsd : aligned[key]?.worldBuyUsd ?? null,
      worldSellUsd: worldSellUsd > 0 ? worldSellUsd : aligned[key]?.worldSellUsd ?? null,
    };
  }

  const marketSeries = Object.entries(aligned)
    .map(([key, item]) => {
      const rate = historicalRates[key] || usdToVnd;
      const domesticSell = item.domesticSell ?? null;
      const domesticBuy = item.domesticBuy ?? null;
      const worldUsd = item.worldUsd ?? null;
      const worldBuyUsd = item.worldBuyUsd ?? null;
      const worldSellUsd = item.worldSellUsd ?? null;

      return {
        at: item.at,
        exchangeRate: rate > 0 ? rate : null,
        domesticBuy,
        domesticSell,
        domesticBuyUsd:
          domesticBuy != null && rate > 0
            ? convertLocalVndToUsdPerOunce(asset, domesticBuy, rate)
            : null,
        domesticSellUsd:
          domesticSell != null && rate > 0
            ? convertLocalVndToUsdPerOunce(asset, domesticSell, rate)
            : null,
        worldUsd,
        worldBuyUsd,
        worldSellUsd,
        worldLocalVnd:
          worldUsd != null && rate > 0 ? convertUsdPerOunceToLocalVnd(asset, worldUsd, rate) : null,
        worldBuyLocalVnd:
          worldBuyUsd != null && rate > 0
            ? convertUsdPerOunceToLocalVnd(asset, worldBuyUsd, rate)
            : null,
        worldSellLocalVnd:
          worldSellUsd != null && rate > 0
            ? convertUsdPerOunceToLocalVnd(asset, worldSellUsd, rate)
            : null,
      };
    })
    .sort((a, b) => a.at - b.at);

  return { marketSeries, currencySeries };
};

const fetchBackendHistory = async (range) => {
  const requestedRange = RANGE_REQUEST_MAP[range] || range;
  const [vnGold, globalGold, vnSilver, globalSilver, usd] = await Promise.all([
    tryBackendGet(`/prices/vn-all/gold/${requestedRange}`),
    tryBackendGet(`/prices/global/gold/${requestedRange}`),
    tryBackendGet(`/prices/vn-all/silver/${requestedRange}`),
    tryBackendGet(`/prices/global/silver/${requestedRange}`),
    tryBackendGetMany([`/prices/USD/${requestedRange}`, `/prices/usd/${requestedRange}`]),
  ]);

  const hasAny = [vnGold, globalGold, vnSilver, globalSilver, usd].some((x) => x.ok);

  return {
    hasAny,
    vnGoldRows: vnGold.ok ? vnGold.data : [],
    globalGoldRows: globalGold.ok ? globalGold.data : [],
    vnSilverRows: vnSilver.ok ? vnSilver.data : [],
    globalSilverRows: globalSilver.ok ? globalSilver.data : [],
    usdRows: usd.ok ? usd.data : [],
  };
};

export const fetchMarketInsights = async (range = "1m") => {
  let productsGold = [];
  let productsSilver = [];
  let worldGoldUsd = toNumber(lastInternational?.worldGoldUsd);
  let worldSilverUsd = toNumber(lastInternational?.worldSilverUsd);
  let usdToVnd = toNumber(lastExchangeRate);
  let goldPremium = 0;
  let silverPremium = 0;

  const backendDomesticGold = await tryBackendGet("/prices/vn-all/gold/1d");
  const backendDomesticSilver = await tryBackendGet("/prices/vn-all/silver/1w");
  const premiumRows = await fetchPremium();

  for (const row of premiumRows) {
    if (row.assetId === 1) goldPremium = toNumber(row.premiumPrice);
    if (row.assetId === 2) silverPremium = toNumber(row.premiumPrice);
  }

  if (backendDomesticGold.ok) {
    productsGold = mapBackendProduct("gold", pickLatest(backendDomesticGold.data));
  }

  if (backendDomesticSilver.ok) {
    productsSilver = mapBackendProduct("silver", pickLatest(backendDomesticSilver.data));
  }

  const backendWorldGold = await tryBackendGet("/prices/global/gold/1d");
  const backendWorldSilver = await tryBackendGet("/prices/global/silver/1d");

  if (backendWorldGold.ok) {
    const latest = pickLatest(backendWorldGold.data);
    worldGoldUsd = toNumber(latest?.sellPrice ?? latest?.sell ?? latest?.buyPrice ?? latest?.buy);
  }

  if (backendWorldSilver.ok) {
    const latest = pickLatest(backendWorldSilver.data);
    worldSilverUsd = toNumber(latest?.sellPrice ?? latest?.sell ?? latest?.buyPrice ?? latest?.buy);
  }

  if (worldGoldUsd > 0 || worldSilverUsd > 0) {
    lastInternational = { worldGoldUsd, worldSilverUsd };
  }

  const backendUsd = await tryBackendGetMany(["/prices/usd/1w", "/prices/USD/1w"]);
  if (backendUsd.ok) {
    const latest = pickLatest(backendUsd.data);
    usdToVnd = toNumber(latest?.sellPrice ?? latest?.sell);
    if (usdToVnd > 0) lastExchangeRate = usdToVnd;
  }

  const history = await fetchBackendHistory(range);

  let goldSeries = [];
  let silverSeries = [];
  let currencySeries = [];

  if (history.hasAny) {
    const goldAligned = alignSeries({
      asset: "gold",
      vnRows: history.vnGoldRows,
      globalRows: history.globalGoldRows,
      currencyRows: history.usdRows,
      usdToVnd,
    });

    const silverAligned = alignSeries({
      asset: "silver",
      vnRows: history.vnSilverRows,
      globalRows: history.globalSilverRows,
      currencyRows: history.usdRows,
      usdToVnd,
    });

    goldSeries = trimSeriesToRange(goldAligned.marketSeries, range);
    silverSeries = trimSeriesToRange(silverAligned.marketSeries, range);
    currencySeries = trimSeriesToRange(goldAligned.currencySeries, range);
  }

  return {
    productsGold,
    productsSilver,
    usdToVnd,
    worldGoldUsd,
    worldSilverUsd,
    worldGoldVnd: convertUsdPerOunceToLocalVnd("gold", worldGoldUsd, usdToVnd),
    worldSilverVnd: convertUsdPerOunceToLocalVnd("silver", worldSilverUsd, usdToVnd),
    goldSeries,
    silverSeries,
    currencySeries,
    goldPremium,
    silverPremium,
    apiErrors: {
      vietnam: productsGold.length === 0 && productsSilver.length === 0,
      international: worldGoldUsd <= 0 && worldSilverUsd <= 0,
      exchange: usdToVnd <= 0,
    },
  };
};

export const numberFmt = (value, digits = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

export const marketUnitMeta = {
  gold: ASSET_META.gold,
  silver: ASSET_META.silver,
  conversions: {
    ouncesPerLuong: OUNCES_PER_LUONG,
    ouncesPerKg: OUNCES_PER_KG,
  },
};
