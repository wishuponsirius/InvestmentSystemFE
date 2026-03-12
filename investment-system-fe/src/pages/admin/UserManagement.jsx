import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  BarChart2,
  Settings,
  Calendar,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "../../pages/admin/UserManagement.module.css";

const UserManagement = () => {
  const [role] = useState("ADMIN");

  const overviewData = [
    { label: "Total", value: "3000" },
    { label: "Role", value: "10" },
    { label: "Active Accounts", value: "2500" },
    { label: "Inactive Accounts", value: "3000" },
    { label: "Active Role", value: "3000" },
    { label: "Inactive Role", value: "3000" },
  ];

  const [users] = useState(
    Array.from({ length: 28 }, (_, i) => ({
      id: i + 1,
      name:
        i === 0
          ? "Nguyen Van A"
          : `User ${String.fromCharCode(65 + (i % 26))} ${i + 1}`,
      email: i === 0 ? "ngvana.admin@gmail.com" : `investor${i + 1}@gmail.com`,
      role: i === 0 ? "ADMIN" : "INVESTOR",
      sync: "5 minutes ago",
      date: "13/01/2026",
      status: i % 3 !== 2,
    })),
  );

  const [currentPage, setCurrentPage] = useState(2);
  const rowsPerPage = 5;

  const currentTableData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return users.slice(start, start + rowsPerPage);
  }, [currentPage, users]);

  return (
    <div className={styles.wrapper}>
      <Header role={role} />

      <main className={styles.mainContent}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User Overview</h2>
          <div className={styles.overviewGrid}>
            {overviewData.map((item, index) => (
              <div key={index} className={styles.overviewCard}>
                <span className={styles.cardLabel}>{item.label}</span>
                <span className={styles.cardValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User Profile Management</h2>

          <div className={styles.contentContainer}>
            <div className={styles.toolbar}>
              <div className={styles.searchGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Nguyen Van A"
                  className={styles.searchInput}
                />
                <X size={18} className={styles.clearIcon} />
              </div>

              <div className={styles.verticalDivider}></div>

              <div className={styles.toolIcons}>
                <button className={styles.toolBtn}>
                  <BarChart2 size={20} />
                </button>
                <button className={styles.toolBtn}>
                  <Settings size={20} />
                </button>
                <button className={styles.toolBtn}>
                  <Calendar size={20} />
                </button>
              </div>

              <div className={styles.filterTags}>
                <span className={`${styles.tag} ${styles.tagAdmin}`}>
                  ADMIN ×
                </span>
                <span className={`${styles.tag} ${styles.tagInvestor}`}>
                  INVESTOR ×
                </span>
              </div>

              <div className={styles.addActions}>
                <button className={styles.addUserBtn}>
                  <UserPlus size={22} />
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Last Sync</th>
                    <th>Date Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTableData.map((user) => (
                    <tr key={user.id}>
                      <td className={styles.userNameText}>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${user.role === "ADMIN" ? styles.badgeAdmin : styles.badgeInvestor}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{user.sync}</td>
                      <td>{user.date}</td>
                      <td>
                        <label className={styles.switch}>
                          <input
                            type="checkbox"
                            checked={user.status}
                            readOnly
                          />
                          <span className={styles.slider}></span>
                        </label>
                      </td>
                      <td className={styles.actions}>
                        <button className={styles.actionBtn}>
                          <Eye size={18} />
                        </button>
                        <button className={styles.actionBtn}>
                          <Pencil size={18} />
                        </button>
                        <button className={styles.actionBtn}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.pagination}>
                {[1, 2, 3, 4, 5, 6].map((page) => (
                  <button
                    key={page}
                    className={
                      currentPage === page ? styles.activePage : styles.pageBtn
                    }
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default UserManagement;
