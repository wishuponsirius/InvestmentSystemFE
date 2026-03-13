import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let lastInternational = null;
let lastExchangeRate = 24000;
let lastSilverNormalizeFactor = 1;

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

const inferSilverNormalizeFactor = (domesticValue, worldSilverVnd) => {
  if (domesticValue <= 0 || worldSilverVnd <= 0) return 1;

  const candidates = [1, 10, 31.1035, 32.1507, 37.5, 100, 1000];
  let bestFactor = 1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const factor of candidates) {
    const normalized = domesticValue / factor;
    const diff = Math.abs(normalized - worldSilverVnd);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestFactor = factor;
    }
  }

  return bestFactor;
};

const mapBackendGoldProducts = (latestRow) => {
  if (!latestRow) return [];

  const buy = normalizeDomesticGoldVnd(
    toNumber(latestRow?.buyPrice ?? latestRow?.buy),
  );
  const sell = normalizeDomesticGoldVnd(
    toNumber(latestRow?.sellPrice ?? latestRow?.sell),
  );
  if (buy <= 0 || sell <= 0) return [];

  return [
    {
      provider: "VN",
      type: "Giá Vàng SJC",
      buy,
      sell,
      spread: Math.max(0, sell - buy),
      updated: latestRow?.timestamp || latestRow?.updateDate || "",
      category: "gold",
    },
    {
      provider: "VN",
      type: "Nhẫn Tròn Trơn 9999",
      buy: Math.max(0, buy - 2100000),
      sell: Math.max(0, sell - 2300000),
      spread: Math.max(0, (sell - 2300000) - (buy - 2100000)),
      updated: latestRow?.timestamp || latestRow?.updateDate || "",
      category: "gold",
    },
    {
      provider: "VN",
      type: "Vàng Nữ Trang 24K",
      buy: Math.max(0, buy - 2500000),
      sell: Math.max(0, sell - 2600000),
      spread: Math.max(0, (sell - 2600000) - (buy - 2500000)),
      updated: latestRow?.timestamp || latestRow?.updateDate || "",
      category: "gold",
    },
    {
      provider: "VN",
      type: "Vàng Miếng PNJ",
      buy: Math.max(0, buy - 100000),
      sell: Math.max(0, sell - 150000),
      spread: Math.max(0, (sell - 150000) - (buy - 100000)),
      updated: latestRow?.timestamp || latestRow?.updateDate || "",
      category: "gold",
    },
    {
      provider: "VN",
      type: "Vàng DOJI AV",
      buy,
      sell: Math.max(0, sell - 50000),
      spread: Math.max(0, (sell - 50000) - buy),
      updated: latestRow?.timestamp || latestRow?.updateDate || "",
      category: "gold",
    },
  ];
};

const mapBackendSilverProducts = (latestRow, normalizeFactor = 1) => {
  if (!latestRow) return [];

  const baseBuy = toNumber(latestRow?.buyPrice ?? latestRow?.buy) / normalizeFactor;
  const baseSell = toNumber(latestRow?.sellPrice ?? latestRow?.sell) / normalizeFactor;
  if (baseBuy <= 0 || baseSell <= 0) return [];

  const updated = latestRow?.timestamp || latestRow?.updateDate || "";

  return [
    {
      provider: "VN",
      type: "Bạc Nguyên Chất 99.99%",
      buy: baseBuy,
      sell: baseSell,
      spread: Math.max(0, baseSell - baseBuy),
      updated,
      category: "silver",
    },
    {
      provider: "VN",
      type: "Bạc Trang Sức 925",
      buy: baseBuy - 150000,
      sell: baseSell - 200000,
      spread: Math.max(0, (baseSell - 200000) - (baseBuy - 150000)),
      updated,
      category: "silver",
    },
    {
      provider: "VN",
      type: "Bạc Ý Cao Cấp",
      buy: baseBuy + 50000,
      sell: baseSell + 50000,
      spread: Math.max(0, (baseSell + 50000) - (baseBuy + 50000)),
      updated,
      category: "silver",
    },
  ];
};

const alignSeries = ({ asset, vnRows, globalRows, currencyRows, usdToVnd, silverNormalizeFactor = 1 }) => {
  const historicalRates = {};
  const currencySeries = [];

  for (const item of currencyRows || []) {
    const key = getDateKey(item);
    if (!key) continue;
    const sell = toNumber(item?.sellPrice ?? item?.sell ?? item?.sell_price);
    if (sell <= 0) continue;
    historicalRates[key] = sell;
    currencySeries.push({ at: toDate(item?.timestamp || item?.updateDate || item?.update_date), value: sell });
  }
  currencySeries.sort((a, b) => a.at - b.at);

  const aligned = {};

  for (const item of vnRows || []) {
    const key = getDateKey(item);
    if (!key) continue;
    let sell = toNumber(item?.sellPrice ?? item?.sell ?? item?.sell_price);
    if (asset === "gold") {
      sell = normalizeDomesticGoldVnd(sell);
    } else if (asset === "silver" && silverNormalizeFactor > 1) {
      sell /= silverNormalizeFactor;
    }
    if (sell <= 0) continue;
    aligned[key] = {
      at: toDate(item?.timestamp || item?.updateDate || item?.update_date),
      domesticSell: sell,
      worldUsd: aligned[key]?.worldUsd ?? null,
      worldVnd: aligned[key]?.worldVnd ?? null,
    };
  }

  for (const item of globalRows || []) {
    const key = getDateKey(item);
    if (!key) continue;
    const worldUsd = toNumber(item?.buyPrice ?? item?.buy ?? item?.price ?? item?.buy_price);
    if (worldUsd <= 0) continue;

    const rate = historicalRates[key] || usdToVnd;
    aligned[key] = {
      at: aligned[key]?.at || toDate(item?.timestamp || item?.updateDate || item?.update_date),
      domesticSell: aligned[key]?.domesticSell ?? null,
      worldUsd,
      worldVnd: rate > 0 ? (worldUsd * rate) / 1000000 : null,
    };
  }

  const marketSeries = Object.values(aligned).sort((a, b) => a.at - b.at);
  return { marketSeries, currencySeries };
};

const fetchBackendHistory = async (range) => {
  const [vnGold, globalGold, vnSilver, globalSilver, usd] = await Promise.all([
    tryBackendGet(`/prices/vn-all/gold/${range}`),
    tryBackendGet(`/prices/global/gold/${range}`),
    tryBackendGet(`/prices/vn-all/silver/${range}`),
    tryBackendGet(`/prices/global/silver/${range}`),
    tryBackendGet(`/prices/USD/${range}`),
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

  const backendDomesticGold = await tryBackendGet("/prices/vn-all/gold/1d");
  const backendDomesticSilver = await tryBackendGet("/prices/vn-all/silver/1w");

  if (backendDomesticGold.ok) {
    productsGold = mapBackendGoldProducts(pickLatest(backendDomesticGold.data));
  }
  if (backendDomesticSilver.ok) {
    productsSilver = mapBackendSilverProducts(pickLatest(backendDomesticSilver.data));
  }

  const backendWorldGold = await tryBackendGet("/prices/global/gold/1d");
  const backendWorldSilver = await tryBackendGet("/prices/global/silver/1d");

  if (backendWorldGold.ok) {
    const latest = pickLatest(backendWorldGold.data);
    worldGoldUsd = toNumber(latest?.buyPrice ?? latest?.buy);
  }
  if (backendWorldSilver.ok) {
    const latest = pickLatest(backendWorldSilver.data);
    worldSilverUsd = toNumber(latest?.buyPrice ?? latest?.buy);
  }

  if (worldGoldUsd > 0 || worldSilverUsd > 0) {
    lastInternational = { worldGoldUsd, worldSilverUsd };
  }

  const backendUsd = await tryBackendGet("/prices/usd/1w");
  if (backendUsd.ok) {
    const latest = pickLatest(backendUsd.data);
    usdToVnd = toNumber(latest?.sellPrice ?? latest?.sell);
    if (usdToVnd > 0) lastExchangeRate = usdToVnd;
  }

  const currentWorldSilverVnd = usdToVnd > 0 ? worldSilverUsd * usdToVnd : 0;
  if (backendDomesticSilver.ok) {
    const latestSilver = pickLatest(backendDomesticSilver.data);
    const rawSilverSell = toNumber(latestSilver?.sellPrice ?? latestSilver?.sell);
    lastSilverNormalizeFactor = inferSilverNormalizeFactor(rawSilverSell, currentWorldSilverVnd);
    productsSilver = mapBackendSilverProducts(latestSilver, lastSilverNormalizeFactor);
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
      silverNormalizeFactor: lastSilverNormalizeFactor,
    });

    goldSeries = goldAligned.marketSeries;
    silverSeries = silverAligned.marketSeries;
    currencySeries = goldAligned.currencySeries;
  }

  return {
    productsGold,
    productsSilver,
    usdToVnd,
    worldGoldUsd,
    worldSilverUsd,
    worldGoldVnd: usdToVnd > 0 ? worldGoldUsd * usdToVnd : 0,
    worldSilverVnd: usdToVnd > 0 ? worldSilverUsd * usdToVnd : 0,
    goldSeries,
    silverSeries,
    currencySeries,
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
