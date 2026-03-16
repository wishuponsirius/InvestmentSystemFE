import React from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "./Portfolio.module.css";
import {
  convertMoney,
  deletePortfolioAsset,
  displayAssets,
  displayCurrencies,
  displayUnits,
  fetchPortfolioData,
  formatMoney,
  savePortfolioAsset,
} from "../../services/portfolioService";

const Portfolio = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [displayCurrency, setDisplayCurrency] = React.useState("USD");
  const [usdToVnd, setUsdToVnd] = React.useState(0);
  const [userId, setUserId] = React.useState("");
  const [holdings, setHoldings] = React.useState([]);
  const [totalProfitLossPercentage, setTotalProfitLossPercentage] = React.useState(0);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState(null);
  const [form, setForm] = React.useState({
    asset: "Gold",
    quantity: "",
    unitDisplay: "Luong",
    entryPrice: "",
    currency: "VND",
  });

  const loadPortfolio = React.useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchPortfolioData();
      setUserId(data.userId || "");
      setUsdToVnd(Number(data.usdToVnd || 0));
      setHoldings(Array.isArray(data.holdings) ? data.holdings : []);
      setTotalProfitLossPercentage(Number(data.totalProfitLossPercentage || 0));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Cannot load portfolio.");
      setHoldings([]);
      setTotalProfitLossPercentage(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const openCreateForm = () => {
    setEditingAsset(null);
    setForm({
      asset: "Gold",
      quantity: "",
      unitDisplay: "Luong",
      entryPrice: "",
      currency: "VND",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingAsset(item.asset);
    setForm({
      asset: item.asset,
      quantity: String(item.quantity ?? ""),
      unitDisplay: item.displayUnit || "Luong",
      entryPrice: String(item.entryPrice ?? ""),
      currency: item.currency || "VND",
    });
    setIsFormOpen(true);
  };

  // When asset type changes, auto-adjust unit to a sensible default
  const handleAssetChange = (value) => {
    setForm((prev) => ({
      ...prev,
      asset: value,
      unitDisplay: value === "USD" ? "Currency Unit" : "Luong",
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity);
    const entryPrice = Number(form.entryPrice);

    if (!quantity || quantity <= 0 || !entryPrice || entryPrice <= 0) {
      setError("Please enter valid quantity and price.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await savePortfolioAsset({
        userId,
        asset: form.asset,
        quantity,
        unitDisplay: form.unitDisplay,
        entryPrice,
        currency: form.currency,
      });
      setIsFormOpen(false);
      await loadPortfolio();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to save asset.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const label =
      item.asset === "Gold"
        ? "SJC Gold"
        : item.asset === "Silver"
        ? "Phu Quy Silver"
        : "USD";
    if (!window.confirm(`Delete ${label}?`)) return;

    setError("");
    try {
      await deletePortfolioAsset({ userId, asset: item.asset });
      await loadPortfolio();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete asset.");
    }
  };

  const toDisplayMoney = (amount, sourceCurrency) => {
    const converted = convertMoney({
      amount,
      sourceCurrency,
      targetCurrency: displayCurrency,
      usdToVnd,
    });
    return formatMoney(converted, displayCurrency);
  };

  const convertedTotalProfitLoss = holdings.reduce(
    (sum, h) =>
      sum +
      convertMoney({
        amount: h.profitLoss,
        sourceCurrency: h.currency,
        targetCurrency: displayCurrency,
        usdToVnd,
      }),
    0,
  );

  const getCardClass = (asset) => {
    if (asset === "Gold") return styles.goldCard;
    if (asset === "Silver") return styles.silverCard;
    if (asset === "USD") return styles.usdCard;
    return "";
  };

  const getSavePreviewLabel = () => {
    if (form.asset === "Gold") return "SJC Gold";
    if (form.asset === "Silver") return "Phu Quy Silver";
    if (form.asset === "USD") return "USD";
    return form.asset;
  };

  // Units available per asset type
  const availableUnits =
    form.asset === "USD"
      ? [{ label: "Currency Unit", value: "Currency Unit" }]
      : displayUnits.map((u) => ({ label: u, value: u }));

  // Assets for the dropdown — extend displayAssets with USD
  const allAssets = [
    ...displayAssets,
    { label: "USD", value: "USD" },
  ];

  return (
    <div className={styles.pageWrapper}>
      <Header role="INVESTOR" />

      <main className={styles.container}>
        <h1 className={styles.pageTitle}>Portfolio Summary</h1>

        <div className={styles.toolbarRow}>
          <button className={styles.refreshBtn} onClick={loadPortfolio} disabled={isLoading}>
            Refresh
          </button>
          <div className={styles.currencyToggle}>
            {displayCurrencies.map((code) => (
              <button
                key={code}
                type="button"
                className={`${styles.currencyBtn} ${displayCurrency === code ? styles.currencyBtnActive : ""}`}
                onClick={() => setDisplayCurrency(code)}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Holdings</h2>
            <button className={styles.addBtn} onClick={openCreateForm}>
              + Record New Transaction
            </button>
          </div>

          <div className={styles.holdingsList}>
            {!isLoading && holdings.length === 0 && <p className={styles.emptyText}>No holdings yet.</p>}
            {holdings.map((item, index) => (
              <div
                key={item.portfolioId != null ? String(item.portfolioId) : `${item.asset}-${item.displayUnit}-${item.currency}-${index}`}
                className={`${styles.holdingCard} ${getCardClass(item.asset)}`}
              >
                <div>
                  <h3 className={styles.assetName}>{item.displayName}</h3>
                  <span className={styles.assetType}>{item.displayUnit}</span>
                </div>

                <div className={styles.assetStats}>
                  <div>
                    <span className={styles.statLabel}>Quantity</span>
                    <p>
                      {Number(item.quantity || 0).toFixed(2)} {item.displayUnit}
                    </p>
                  </div>
                  <div>
                    <span className={styles.statLabel}>Entry Price/Unit</span>
                    <p>{toDisplayMoney(item.entryPrice, item.currency)}</p>
                  </div>
                </div>

                <div className={styles.actionRow}>
                  <button className={styles.secondaryBtn} onClick={() => openEditForm(item)}>
                    Edit
                  </button>
                  <button className={styles.dangerBtn} onClick={() => handleDelete(item)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {isFormOpen && (
          <div className={styles.modalOverlay}>
            <form className={styles.modalCard} onSubmit={handleSave}>
              <h3 className={styles.modalTitle}>{editingAsset != null ? "Edit Asset" : "Record Transaction"}</h3>

              <label className={styles.formLabel}>Asset Type</label>
              <select
                className={styles.formInput}
                value={form.asset}
                onChange={(e) => handleAssetChange(e.target.value)}
              >
                {allAssets.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label className={styles.formLabel}>Quantity</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="0.00"
                required
              />

              <label className={styles.formLabel}>Unit</label>
              <select
                className={styles.formInput}
                value={form.unitDisplay}
                onChange={(e) => setForm((prev) => ({ ...prev, unitDisplay: e.target.value }))}
              >
                {availableUnits.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>

              <label className={styles.formLabel}>Entry Price Per Unit ({form.currency})</label>
              <input
                className={styles.formInput}
                type="number"
                step="0.01"
                value={form.entryPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, entryPrice: e.target.value }))}
                placeholder={form.currency === "USD" ? "0.00 USD" : "0 VND"}
                required
              />

              <label className={styles.formLabel}>Currency</label>
              <select
                className={styles.formInput}
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
              >
                {displayCurrencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <p className={styles.previewText}>
                Saving as: {getSavePreviewLabel()} — {form.unitDisplay} — {form.currency}
              </p>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.addBtn} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Portfolio;
