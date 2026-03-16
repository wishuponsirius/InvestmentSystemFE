import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const DISPLAY_ASSET = {
  Gold: "SJC Gold",
  Silver: "Phu Quy Silver",
};

const DISPLAY_UNIT = {
  "Chỉ": "Chỉ",
  "Lượng": "Lượng",
  Kilogram: "Kg",
  "Currency Unit": "Currency",
};

const API_UNIT = {
  Chi: "Chỉ",
  Luong: "Lượng",
  Kg: "Kilogram",
  "Currency Unit": "Currency Unit",
};

const toNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

export const getCurrentUserId = () => {
  const fromStorage = localStorage.getItem("userId");
  if (fromStorage) return fromStorage;

  const token = localStorage.getItem("accessToken");
  if (!token) return "";

  const payload = decodeJwtPayload(token);
  const fromToken =
    payload?.userId ||
    payload?.user_id ||
    payload?.id ||
    payload?.sub ||
    payload?.uid ||
    "";

  if (fromToken) {
    localStorage.setItem("userId", String(fromToken));
  }

  return String(fromToken || "");
};

const resolveCurrentUserId = async () => {
  const current = getCurrentUserId();
  if (current) return current;

  const meRes = await tryGet("/me");
  if (meRes.ok && meRes.data && typeof meRes.data === "object") {
    const candidate =
      meRes.data.id ||
      meRes.data.userId ||
      meRes.data.user_id ||
      meRes.data.sub ||
      meRes.data.uid ||
      "";

    if (candidate) {
      localStorage.setItem("userId", String(candidate));
      return String(candidate);
    }
  }

  return "";
};

const tryGet = async (path) => {
  try {
    const response = await api.get(path, { headers: getHeaders() });
    return { ok: true, data: response.data };
  } catch (error) {
    return { ok: false, error, data: null };
  }
};

const pickLatest = (rows) => (Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null);

const fetchUsdToVnd = async () => {
  const res = await tryGet("/prices/usd/1w");
  if (!res.ok || !Array.isArray(res.data) || res.data.length === 0) return 0;
  const latest = pickLatest(res.data);
  return toNumber(latest?.sellPrice ?? latest?.sell);
};

const fetchBenchmarks = async () => {
  const [goldRes, silverRes, usdToVnd] = await Promise.all([
    tryGet("/prices/vn-all/gold/1d"),
    tryGet("/prices/vn-all/silver/1w"),
    fetchUsdToVnd(),
  ]);

  let goldSell = 0;
  let silverSell = 0;

  if (goldRes.ok && Array.isArray(goldRes.data) && goldRes.data.length) {
    const latestGold = pickLatest(goldRes.data);
    goldSell = toNumber(latestGold?.sellPrice ?? latestGold?.sell);
  }

  if (silverRes.ok && Array.isArray(silverRes.data) && silverRes.data.length) {
    const latestSilver = pickLatest(silverRes.data);
    silverSell = toNumber(latestSilver?.sellPrice ?? latestSilver?.sell);
  }

  return { goldSell, silverSell, usdToVnd };
};

const normalizeListHolding = (item, benchmark) => {
  const portfolioId = item?.portfolioId ?? item?.id ?? null;
  const asset = String(item?.asset || "Gold");
  const quantity = toNumber(item?.quantity);
  const entryPrice = toNumber(item?.entryPrice);
  const currency = String(item?.currency || "VND").toUpperCase();

  const isGold = asset.toLowerCase().includes("gold");
  const currentVnd = isGold ? benchmark.goldSell : benchmark.silverSell;
  const currentPrice = currency === "USD" && benchmark.usdToVnd > 0 ? currentVnd / benchmark.usdToVnd : currentVnd;

  const marketValue = quantity * (currentPrice > 0 ? currentPrice : entryPrice);
  const costValue = quantity * entryPrice;
  const profitLoss = marketValue - costValue;
  const profitLossPercentage = costValue > 0 ? (profitLoss / costValue) * 100 : 0;

  const unit = String(item?.unit || "Lượng");

  return {
    portfolioId,
    asset,
    displayName: DISPLAY_ASSET[asset] || asset,
    quantity,
    unit,
    displayUnit: DISPLAY_UNIT[unit] || unit,
    entryPrice,
    buyPrice: entryPrice,
    sellPrice: currentPrice > 0 ? currentPrice : entryPrice,
    currency,
    marketValue,
    profitLoss,
    profitLossPercentage,
  };
};

export const fetchPortfolioData = async () => {
  const userId = await resolveCurrentUserId();
  if (!userId) throw new Error("User session is invalid. Please login again.");

  const listRes = await tryGet(`/portfolio/${userId}`);
  if (!listRes.ok) {
    const status = listRes.error?.response?.status;
    if (status === 404) {
      return {
        userId,
        usdToVnd: await fetchUsdToVnd(),
        totalProfitLoss: 0,
        totalProfitLossPercentage: 0,
        holdings: [],
      };
    }
    throw new Error("Cannot load portfolio.");
  }
  if (!Array.isArray(listRes.data)) {
    throw new Error("Cannot load portfolio.");
  }

  const benchmark = await fetchBenchmarks();
  const holdings = listRes.data.map((item) => normalizeListHolding(item, benchmark));
  const totalProfitLoss = holdings.reduce((sum, h) => sum + h.profitLoss, 0);
  const totalWealth = holdings.reduce((sum, h) => sum + h.marketValue, 0);

  return {
    userId,
    usdToVnd: benchmark.usdToVnd,
    totalProfitLoss,
    totalProfitLossPercentage: totalWealth > 0 ? (totalProfitLoss / totalWealth) * 100 : 0,
    holdings,
  };
};

export const fetchPortfolioAIAnalysis = async () => {
  const userId = await resolveCurrentUserId();
  if (!userId) throw new Error("User session is invalid. Please login again.");

  try {
    const response = await api.post(
      `/portfolio/report/${userId}/generate`,
      {}, // body (empty because endpoint doesn't require payload)
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
  console.error("Portfolio AI analysis API failed:", error);
  throw error;
}
};

export const fetchLastPortfolioReport = async () => {
  const userId = await resolveCurrentUserId();
  if (!userId) throw new Error("User session is invalid. Please login again.");

  const res = await tryGet(`/portfolio/report/${userId}`);

  if (!res.ok || !res.data) {
    throw new Error("Cannot load latest portfolio report.");
  }

  return res.data;
};

export const savePortfolioAsset = async ({ userId, asset, quantity, unitDisplay, entryPrice, currency }) => {
  const uid = userId || (await resolveCurrentUserId());
  if (!uid) throw new Error("User session is invalid. Please login again.");

  const payload = {
    userId: uid,
    asset,
    quantity: Number(quantity),
    unit: API_UNIT[unitDisplay] || "Lượng",
    entryPrice: Number(entryPrice),
    currency: String(currency).toUpperCase(),
  };

  try {
    await api.post("/portfolio", payload, { headers: getHeaders() });
    return;
  } catch (error) {
    const fallbackBody = {
      assetName: asset,
      quantity: Number(quantity),
      unitSymbol: API_UNIT[unitDisplay] || "Lượng",
      entryPrice: Number(entryPrice),
      currencyCode: String(currency).toUpperCase(),
    };
    await api.put(`/portfolio/${uid}`, fallbackBody, { headers: getHeaders() });
  }
};

export const deletePortfolioAsset = async ({ userId, asset }) => {
  const uid = userId || (await resolveCurrentUserId());
  if (!uid) throw new Error("User session is invalid. Please login again.");

  const encodedAsset = encodeURIComponent(asset);
  try {
    await api.delete(`/portfolio/${uid}/${encodedAsset}`, { headers: getHeaders() });
    return;
  } catch (_) {
    await api.delete(`/portfolio/${uid}`, { headers: getHeaders() });
  }
};

export const displayAssets = [
  { value: "Gold", label: "SJC Gold" },
  { value: "Silver", label: "Phu Quy Silver" },
];

export const displayUnits = ["Chi", "Luong", "Kg"];
export const displayCurrencies = ["VND", "USD"];

export const formatMoney = (value, currency = "USD") => {
  const amount = toNumber(value);
  if (currency === "USD") {
    return `$${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  }

  return `VND ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;
};

export const convertMoney = ({ amount, sourceCurrency, targetCurrency, usdToVnd }) => {
  const from = String(sourceCurrency || "VND").toUpperCase();
  const to = String(targetCurrency || "VND").toUpperCase();
  const value = toNumber(amount);

  if (from === to || value === 0) return value;
  if (!usdToVnd || usdToVnd <= 0) return value;

  if (from === "USD" && to === "VND") return value * usdToVnd;
  if (from === "VND" && to === "USD") return value / usdToVnd;
  return value;
};
