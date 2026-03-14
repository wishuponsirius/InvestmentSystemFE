import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "../../pages/admin/AdminDashboard.module.css";
import {
  Activity,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Coins,
  Gem,
  Globe,
  Play, // <-- Thêm Icon Play
} from "lucide-react";

const AdminDashboard = () => {
  const [role] = useState("ADMIN");
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const fetchHealth = async () => {
    try {
      setApiError(null);
      const token = localStorage.getItem("accessToken");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const response = await axios.get(
        "http://localhost:8080/ingest/health",
        config,
      );
      if (response.data) setHealthData(response.data);
    } catch (error) {
      console.error("Error fetching health data:", error);
      if (error.response?.status === 401) {
        setApiError("Unauthorized. Redirecting...");
        localStorage.removeItem("accessToken");
        setTimeout(() => navigate("/login"), 1000);
        return;
      }
      setApiError("System monitor is temporarily unavailable.");
      setHealthData({ status: "error", jobs: {}, stale_data: {} });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const allJobs = useMemo(() => {
    if (!healthData?.jobs) return [];
    return Object.entries(healthData.jobs);
  }, [healthData]);

  const stats = useMemo(() => {
    return {
      gold: allJobs.filter(([key]) => key.startsWith("gold")).length,
      silver: allJobs.filter(([key]) => key.startsWith("silver")).length,
      forex: allJobs.filter(([key]) => key.startsWith("forex")).length,
    };
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    if (filterCategory === "ALL") return allJobs;
    return allJobs.filter(([key]) =>
      key.startsWith(filterCategory.toLowerCase()),
    );
  }, [allJobs, filterCategory]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const currentJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  const handleFilterChange = (cat) => {
    setFilterCategory(cat);
    setCurrentPage(1);
  };

  const isAllFresh = useMemo(() => {
    if (!healthData?.stale_data) return true;
    return Object.values(healthData.stale_data).every((v) => {
      if (typeof v === "boolean") return v === false;
      if (typeof v === "object" && v !== null)
        return Object.values(v).every((val) => val === false);
      return true;
    });
  }, [healthData]);

  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 className="animate-spin text-[#FFDA91]" size={40} />
        <p>Loading System Metrics...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <Header role={role} />
      <main className={styles.mainContent}>
        {apiError && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-xl flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={20} />
            <span className="text-amber-800 text-sm font-medium">
              {apiError}
            </span>
          </div>
        )}

        <section className="mb-12">
          <h2 className={styles.sectionTitle}>
            <Activity size={20} className="text-[#FFDA91]" /> System Health
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <HealthCard
              title="Status"
              value={healthData?.status || "OFFLINE"}
              status={healthData?.status === "running" ? "success" : "error"}
              isLive={healthData?.status === "running"}
              icon={<Activity size={18} className="text-blue-500" />}
            />
            <HealthCard
              title="Total Jobs"
              value={allJobs.length}
              icon={<CheckCircle2 size={18} className="text-green-500" />}
            />
            <HealthCard
              title="Data Freshness"
              value={isAllFresh ? "FRESH" : "STALE"}
              status={isAllFresh ? "success" : "warning"}
              icon={<AlertTriangle size={18} className="text-orange-500" />}
            />
            <HealthCard
              title="Gold Jobs"
              value={stats.gold}
              icon={<Coins size={18} className="text-yellow-500" />}
            />
            <HealthCard
              title="Silver Jobs"
              value={stats.silver}
              icon={<Gem size={18} className="text-gray-400" />}
            />
            <HealthCard
              title="Forex Jobs"
              value={stats.forex}
              icon={<Globe size={18} className="text-green-700" />}
            />
          </div>
        </section>

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className={styles.sectionTitle}>
              <Activity size={20} className="text-[#FFDA91]" /> Detailed Job
              Monitor
            </h2>

            <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm">
              <div className="pl-3 text-gray-400">
                <Filter size={14} />
              </div>
              {["ALL", "GOLD", "SILVER", "FOREX"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(cat)}
                  className={`${styles.filterBtn} ${filterCategory === cat ? styles.activeFilter : ""}`}
                >
                  {cat}
                </button>
              ))}
              <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
              <button className={styles.refreshBtn} onClick={fetchHealth}>
                <RefreshCcw size={14} /> Refresh All
              </button>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.managementTable}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Job Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Last Sync (UTC)</th>
                  <th>Integrity</th>
                  <th className="text-center">Action</th> {/* <-- Cột mới */}
                </tr>
              </thead>
              <tbody>
                {currentJobs.length > 0 ? (
                  currentJobs.map(([key, value]) => (
                    <TableRow
                      key={key}
                      id={key}
                      data={value}
                      staleData={healthData?.stale_data}
                      onRefresh={fetchHealth} // <-- Truyền hàm fetchHealth xuống để load lại data sau khi trigger
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-20 text-gray-400 italic"
                    >
                      No jobs found matching "{filterCategory}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className={styles.pageInfo}>
                  Page <strong>{currentPage}</strong> of{" "}
                  <strong>{totalPages}</strong>
                </span>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const HealthCard = ({ title, value, status, isLive, icon }) => (
  <div
    className={`${styles.healthCard} ${status === "error" ? styles.borderError : ""}`}
  >
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {title}
        </span>
      </div>
      {isLive && <div className={styles.liveDot} />}
    </div>
    <div className="text-2xl font-black text-gray-800 uppercase">{value}</div>
  </div>
);

// --- COMPONENT TABLEROW ---
const TableRow = ({ id, data, staleData, onRefresh }) => {
  const [isTriggering, setIsTriggering] = useState(false); // Trạng thái loading riêng của từng nút

  const category = id.split("_")[0].toLowerCase();
  const subCategory = id.split("_")[1];

  const getCategoryStyle = (cat) => {
    switch (cat) {
      case "gold":
        return styles.tagGold;
      case "silver":
        return styles.tagSilver;
      case "forex":
        return styles.tagForex;
      default:
        return styles.categoryBadge;
    }
  };

  let isStale = false;
  if (staleData) {
    const info = staleData[category];
    isStale = typeof info === "object" ? info[subCategory] : info;
  }

  // Hàm xử lý Trigger API POST
  const handleTriggerJob = async () => {
    setIsTriggering(true);
    try {
      const token = localStorage.getItem("accessToken");
      // Quy đổi id: "gold_vn_latest" -> "/jobs/gold/vn/latest"
      const endpoint = `http://localhost:8080/ingest/jobs/${id.replace(/_/g, "/")}`;

      await axios.post(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Thành công -> Làm mới toàn bộ bảng để cập nhật status và thời gian mới nhất
      onRefresh();
    } catch (error) {
      console.error(`Failed to trigger job ${id}:`, error);
      alert(
        `Lỗi khi kích hoạt ${id.toUpperCase()}. Xem console để biết thêm chi tiết.`,
      );
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
      <td className="px-6 py-4 font-bold text-gray-700 text-xs">
        {id.replace(/_/g, " ").toUpperCase()}
      </td>
      <td className="px-6 py-4">
        <span
          className={`${styles.categoryBadge} ${getCategoryStyle(category)}`}
        >
          {category.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`${styles.statusText} ${styles[data.status]}`}>
          {" "}
          ● {data.status?.toUpperCase()}
        </span>
      </td>
      <td className="px-6 py-4 text-[10px] text-gray-400 font-mono">
        {data.timestamp ? new Date(data.timestamp).toLocaleString() : "---"}
      </td>
      <td className="px-6 py-4">
        <span
          className={
            isStale
              ? "text-red-500 font-bold text-[10px]"
              : "text-green-500 font-bold text-[10px]"
          }
        >
          {isStale ? " STALE" : "✓ FRESH"}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {/* NÚT TRIGGER MỚI */}
        <button
          onClick={handleTriggerJob}
          disabled={isTriggering}
          className={styles.triggerBtn}
          title="Run Job Now"
        >
          {isTriggering ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}
        </button>
      </td>
    </tr>
  );
};

export default AdminDashboard;
