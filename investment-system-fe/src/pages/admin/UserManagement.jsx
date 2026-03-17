import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Search,
  X,
  UserPlus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Building2,
  Briefcase,
} from "lucide-react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "../../pages/admin/UserManagement.module.css";

const UserManagement = () => {
  const [role] = useState("ADMIN");

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);
  const rowsPerPage = 5;

  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [newUserData, setNewUserData] = useState({
    orgName: "",
    contactEmail: "",
    role: "INSTITUTION",
  });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // --- HỆ THỐNG TOAST THÔNG BÁO ---
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000); // Tự động ẩn sau 3 giây
  };

  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsFetchingSuggestions(true);
      setShowSuggestions(true);
      try {
        const token = localStorage.getItem("accessToken");
        let apiUrl = `http://localhost:8080/admin/users?page=0&size=5&search=${encodeURIComponent(searchInput)}`;
        if (selectedRole) apiUrl += `&role=${selectedRole}`;
        apiUrl += `&sortBy=createDate&sortDir=desc`;

        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) setSuggestions(response.data.data.content);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, selectedRole]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        let apiUrl = `http://localhost:8080/admin/users?page=${currentPage - 1}&size=${rowsPerPage}`;
        if (searchKeyword)
          apiUrl += `&search=${encodeURIComponent(searchKeyword)}`;
        if (selectedRole) apiUrl += `&role=${selectedRole}`;
        apiUrl += `&sortBy=createDate&sortDir=desc`;

        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setUsers(response.data.data.content);
          setTotalPages(response.data.data.totalPages || 1);
          setTotalSystemUsers(response.data.data.totalElements || 0);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load user data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, searchKeyword, selectedRole, refreshTrigger]);

  const pageStats = useMemo(() => {
    const activeCount = users.filter((u) => u.isActive === true).length;
    const inactiveCount = users.filter((u) => u.isActive === false).length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const instCount = users.filter((u) => u.role === "INSTITUTION").length;

    return [
      {
        label: "Total (System)",
        value: totalSystemUsers,
        icon: Users,
        color: "#3b82f6",
        bg: "#eff6ff",
      },
      {
        label: "Role Types",
        value: 2,
        icon: Briefcase,
        color: "#6b7280",
        bg: "#f3f4f6",
      },
      {
        label: "Active (This page)",
        value: activeCount,
        icon: UserCheck,
        color: "#10b981",
        bg: "#ecfdf5",
      },
      {
        label: "Inactive (This page)",
        value: inactiveCount,
        icon: UserX,
        color: "#ef4444",
        bg: "#fef2f2",
      },
      {
        label: "Admins (This page)",
        value: adminCount,
        icon: ShieldAlert,
        color: "#8b5cf6",
        bg: "#f5f3ff",
      },
      {
        label: "Institutions (This page)",
        value: instCount,
        icon: Building2,
        color: "#f59e0b",
        bg: "#fffbeb",
      },
    ];
  }, [users, totalSystemUsers]);

  const getInitials = (name) => {
    if (!name) return "US";
    return name.substring(0, 2).toUpperCase();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        "http://localhost:8080/admin/users",
        newUserData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setIsAddModalOpen(false);
        setNewUserData({ orgName: "", contactEmail: "", role: "INSTITUTION" });
        setCurrentPage(1);
        setRefreshTrigger((prev) => prev + 1);
        showToast("User created successfully!", "success");
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to create new user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleViewUser = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://localhost:8080/admin/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setIsViewModalOpen(true);
      }
    } catch {
      showToast("Failed to load user details.", "error");
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser({
      id: user.id,
      orgName: user.orgName,
      contactEmail: user.contactEmail,
      role: user.role,
      isActive: user.isActive,
    });
    setUpdateError("");
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError("");
    try {
      const token = localStorage.getItem("accessToken");
      const payload = {
        id: editingUser.id,
        orgName: editingUser.orgName,
        role: editingUser.role,
        isActive: editingUser.isActive,
      };
      const response = await axios.patch(
        `http://localhost:8080/admin/users/${editingUser.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setRefreshTrigger((prev) => prev + 1);
        showToast("User updated successfully!", "success");
      }
    } catch (err) {
      setUpdateError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setEditingUser((prev) => ({ ...prev, isActive: value === "true" }));
    } else {
      setEditingUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?",
    );
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `http://localhost:8080/admin/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        showToast("User deleted successfully!", "success");
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to delete user.",
        "error",
      );
    }
  };

  const handleSearch = () => {
    setSearchKeyword(searchInput);
    setCurrentPage(1);
    setShowSuggestions(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };
  const clearSearch = () => {
    setSearchInput("");
    setSearchKeyword("");
    setCurrentPage(1);
    setShowSuggestions(false);
  };
  const handleSuggestionClick = (user) => {
    setSearchInput(user.orgName);
    setSearchKeyword(user.orgName);
    setCurrentPage(1);
    setShowSuggestions(false);
  };
  const toggleRoleFilter = (clickedRole) => {
    if (selectedRole === clickedRole) setSelectedRole("");
    else setSelectedRole(clickedRole);
    setCurrentPage(1);
  };
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  return (
    <div className={styles.wrapper}>
      <Header role={role} />

      <main className={styles.mainContent}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User Overview</h2>
          <div className={styles.overviewGrid}>
            {pageStats.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={styles.overviewCard}>
                  <div className={styles.cardHeader}>
                    <div
                      className={styles.cardIconWrapper}
                      style={{ backgroundColor: item.bg, color: item.color }}
                    >
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className={styles.cardInfo}>
                    <span className={styles.cardValue}>{item.value}</span>
                    <span className={styles.cardLabel}>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User Profile Management</h2>

          <div className={styles.contentContainer}>
            <div className={styles.toolbar}>
              <div
                className={styles.searchGroupWrapper}
                ref={searchContainerRef}
              >
                <div className={styles.searchGroup}>
                  <Search
                    size={18}
                    className={styles.searchIcon}
                    onClick={handleSearch}
                    style={{ cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    placeholder="Search by organization name..."
                    className={styles.searchInput}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (searchInput.trim()) setShowSuggestions(true);
                    }}
                  />
                  {searchInput && (
                    <X
                      size={18}
                      className={styles.clearIcon}
                      onClick={clearSearch}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                </div>

                {showSuggestions && (
                  <div className={styles.suggestionBox}>
                    {isFetchingSuggestions ? (
                      <div className={styles.suggestionState}>
                        <Loader2 size={16} className={styles.spinIcon} />{" "}
                        Searching...
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((su) => (
                        <div
                          key={su.id}
                          className={styles.suggestionItem}
                          onClick={() => handleSuggestionClick(su)}
                        >
                          <div className={styles.sugName}>{su.orgName}</div>
                          <div className={styles.sugEmail}>
                            {su.contactEmail}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.suggestionState}>
                        No users found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.verticalDivider}></div>

              <div className={styles.filterTags}>
                <span
                  className={`${styles.tag} ${styles.tagAdmin}`}
                  style={{
                    opacity:
                      selectedRole === "" || selectedRole === "ADMIN" ? 1 : 0.4,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleRoleFilter("ADMIN")}
                >
                  <ShieldAlert
                    size={12}
                    style={{
                      display: "inline",
                      marginRight: "4px",
                      verticalAlign: "text-bottom",
                    }}
                  />{" "}
                  ADMIN
                </span>
                <span
                  className={`${styles.tag} ${styles.tagInvestor}`}
                  style={{
                    opacity:
                      selectedRole === "" || selectedRole === "INSTITUTION"
                        ? 1
                        : 0.4,
                    cursor: "pointer",
                  }}
                  onClick={() => toggleRoleFilter("INSTITUTION")}
                >
                  <Building2
                    size={12}
                    style={{
                      display: "inline",
                      marginRight: "4px",
                      verticalAlign: "text-bottom",
                    }}
                  />{" "}
                  INSTITUTION
                </span>
              </div>

              <div className={styles.addActions}>
                <button
                  className={styles.addUserBtn}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <UserPlus size={22} />
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User / Organization</th>
                    <th>Role</th>
                    <th>Date Joined</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right", paddingRight: "20px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "60px" }}
                      >
                        <Loader2
                          size={30}
                          className={styles.spinIcon}
                          style={{ margin: "0 auto", color: "#3b82f6" }}
                        />
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "red",
                        }}
                      >
                        {error}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#888",
                        }}
                      >
                        No users found. Try adjusting your search or filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className={styles.tableRow}>
                        <td className={styles.userCell}>
                          <div className={styles.avatar}>
                            {getInitials(user.orgName)}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.userNameText}>
                              {user.orgName}
                            </span>
                            <span className={styles.userEmailText}>
                              {user.contactEmail}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${user.role === "ADMIN" ? styles.badgeAdmin : styles.badgeInvestor}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className={styles.dateText}>
                          {formatDate(user.createDate)}
                        </td>
                        <td>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={user.isActive}
                              readOnly
                            />
                            <span className={styles.slider}></span>
                          </label>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actions}>
                            <button
                              className={`${styles.actionBtn} ${styles.btnView}`}
                              onClick={() => handleViewUser(user.id)}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.btnEdit}`}
                              onClick={() => handleOpenEditModal(user)}
                              title="Edit User"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.btnDelete}`}
                              onClick={() => handleDeleteUser(user.id)}
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {!isLoading && totalPages > 0 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`${styles.pageNumberBtn} ${currentPage === page ? styles.activePage : ""}`}
                            >
                              {page}
                            </button>
                          );
                        }
                        if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className={styles.pageEllipsis}>
                              ...
                            </span>
                          );
                        }
                        return null;
                      },
                    )}
                  </div>
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
          </div>
        </section>
      </main>

      <Footer />

      {/* --- HIỂN THỊ TOAST THÔNG BÁO --- */}
      {toast.show && (
        <div
          className={`${styles.toast} ${styles[toast.type === "success" ? "toastSuccess" : "toastError"]}`}
        >
          {toast.message}
        </div>
      )}

      {/* --- Modal Create User --- */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New User</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className={styles.modalForm}>
              <div className={styles.modalFormGroup}>
                <label>Organization / User Name</label>
                <input
                  type="text"
                  name="orgName"
                  value={newUserData.orgName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Contact Email</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={newUserData.contactEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Role</label>
                <select
                  name="role"
                  value={newUserData.role}
                  onChange={handleInputChange}
                >
                  <option value="INSTITUTION">Institution</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {submitError && (
                <div className={styles.modalError}>{submitError}</div>
              )}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal Edit User --- */}
      {isEditModalOpen && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit User</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className={styles.modalForm}>
              <div className={styles.modalFormGroup}>
                <label>Contact Email (Cannot be changed)</label>
                <input
                  type="email"
                  value={editingUser.contactEmail}
                  disabled
                  style={{ backgroundColor: "#f5f5f5", color: "#888" }}
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Organization / User Name</label>
                <input
                  type="text"
                  name="orgName"
                  value={editingUser.orgName}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Role</label>
                <select
                  name="role"
                  value={editingUser.role}
                  onChange={handleEditInputChange}
                >
                  <option value="INSTITUTION">Institution</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className={styles.modalFormGroup}>
                <label>Status</label>
                <select
                  name="isActive"
                  value={editingUser.isActive.toString()}
                  onChange={handleEditInputChange}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              {updateError && (
                <div className={styles.modalError}>{updateError}</div>
              )}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal View User Details --- */}
      {isViewModalOpen && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>User Details</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setIsViewModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalForm}>
              <div className={styles.modalFormGroup}>
                <label>Organization / User Name</label>
                <input
                  type="text"
                  value={selectedUser.orgName || "N/A"}
                  readOnly
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Contact Email</label>
                <input
                  type="text"
                  value={selectedUser.contactEmail || "N/A"}
                  readOnly
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Role</label>
                <input
                  type="text"
                  value={selectedUser.role || "N/A"}
                  readOnly
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Account Status</label>
                <input
                  type="text"
                  value={selectedUser.isActive ? "Active" : "Inactive"}
                  readOnly
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>System Status</label>
                <input
                  type="text"
                  value={selectedUser.isDelete ? "Deleted" : "Not Deleted"}
                  style={{
                    color: selectedUser.isDelete ? "#d93025" : "inherit",
                  }}
                  readOnly
                />
              </div>
              <div className={styles.modalFormGroup}>
                <label>Date Joined</label>
                <input
                  type="text"
                  value={formatDate(selectedUser.createDate)}
                  readOnly
                />
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
