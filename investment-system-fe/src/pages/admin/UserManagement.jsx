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
} from "lucide-react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import styles from "../../pages/admin/UserManagement.module.css";

const UserManagement = () => {
  const [role] = useState("ADMIN");

  // State quản lý dữ liệu bảng chính
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSystemUsers, setTotalSystemUsers] = useState(0);
  const rowsPerPage = 5;

  // State cho Search và Filter
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  // State cho dropdown gợi ý
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // State cho Create User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [newUserData, setNewUserData] = useState({
    orgName: "",
    contactEmail: "",
    role: "INSTITUTION",
  });

  // State cho View User Details Modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // --- THÊM MỚI: State cho Edit User Modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const searchContainerRef = useRef(null);

  // TẮT DROPDOWN KHI CLICK RA NGOÀI
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

  // GỌI API GỢI Ý (DEBOUNCE 400ms)
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

        if (response.data.success) {
          setSuggestions(response.data.data.content);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, selectedRole]);

  // GỌI API BẢNG CHÍNH
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

  // TÍNH TOÁN THỐNG KÊ TRỰC TIẾP
  const pageStats = useMemo(() => {
    const activeCount = users.filter((u) => u.isActive === true).length;
    const inactiveCount = users.filter((u) => u.isActive === false).length;
    const adminCount = users.filter((u) => u.role === "ADMIN").length;
    const instCount = users.filter((u) => u.role === "INSTITUTION").length;

    return [
      { label: "Total (System)", value: totalSystemUsers },
      { label: "Role Types", value: 2 },
      { label: "Active (This page)", value: activeCount },
      { label: "Inactive (This page)", value: inactiveCount },
      { label: "Admins (This page)", value: adminCount },
      { label: "Institutions (This page)", value: instCount },
    ];
  }, [users, totalSystemUsers]);

  // --- HÀM TẠO USER ---
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
        alert("User created successfully!");
      }
    } catch (err) {
      console.error("Error creating user:", err);
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

  // --- HÀM LẤY CHI TIẾT USER (VIEW) ---
  const handleViewUser = async (id) => {
    setIsFetchingDetails(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `http://localhost:8080/admin/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        setSelectedUser(response.data.data);
        setIsViewModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
      alert("Failed to load user details.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // --- THÊM MỚI: HÀM MỞ MODAL EDIT USER ---
  const handleOpenEditModal = (user) => {
    // Đổ dữ liệu hiện tại của user vào form
    setEditingUser({
      id: user.id,
      orgName: user.orgName,
      contactEmail: user.contactEmail, // Email chỉ để hiển thị, ko gửi lúc Update
      role: user.role,
      isActive: user.isActive,
    });
    setUpdateError("");
    setIsEditModalOpen(true);
  };

  // --- THÊM MỚI: HÀM CẬP NHẬT USER (UPDATE) ---
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError("");

    try {
      const token = localStorage.getItem("accessToken");

      // Đã thêm 'id' vào payload theo yêu cầu của Swagger
      const payload = {
        id: editingUser.id,
        orgName: editingUser.orgName,
        role: editingUser.role,
        isActive: editingUser.isActive,
      };

      // Gọi API với method PATCH (hoặc thay bằng PATCH nếu Swagger yêu cầu)
      const response = await axios.patch(
        `http://localhost:8080/admin/users/${editingUser.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        setRefreshTrigger((prev) => prev + 1); // Refresh lại bảng
        alert("User updated successfully!");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      setUpdateError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setEditingUser((prev) => ({ ...prev, isActive: value === "true" })); // Chuyển chuỗi select thành boolean
    } else {
      setEditingUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  // --- THÊM MỚI: HÀM XÓA USER (DELETE) ---
  const handleDeleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?",
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.delete(
        `http://localhost:8080/admin/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        alert("User deleted successfully!");
        setRefreshTrigger((prev) => prev + 1); // Refresh bảng sau khi xóa
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  // Các hàm xử lý sự kiện
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const paginationArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.wrapper}>
      <Header role={role} />

      <main className={styles.mainContent}>
        {/* Overview Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User Overview</h2>
          <div className={styles.overviewGrid}>
            {pageStats.map((item, index) => (
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
              {/* Search Group */}
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
                    placeholder="Search user..."
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

                {/* Dropdown Gợi ý */}
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

              {/* Filter Tags */}
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
                  ADMIN {selectedRole === "ADMIN" && "×"}
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
                  INSTITUTION {selectedRole === "INSTITUTION" && "×"}
                </span>
              </div>

              {/* MỞ MODAL CREATE USER KHI CLICK */}
              <div className={styles.addActions}>
                <button
                  className={styles.addUserBtn}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <UserPlus size={22} />
                </button>
              </div>
            </div>

            {/* Table Wrapper */}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Account</th>
                    <th>Role</th>
                    <th>Date Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: "40px" }}
                      >
                        <Loader2
                          size={24}
                          className={styles.spinIcon}
                          style={{ margin: "0 auto" }}
                        />
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan="6"
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
                        colSpan="6"
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className={styles.userNameText}>{user.orgName}</td>
                        <td>{user.contactEmail}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${user.role === "ADMIN" ? styles.badgeAdmin : styles.badgeInvestor}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td>{formatDate(user.createDate)}</td>
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
                        <td className={styles.actions}>
                          {/* VIEW BTN */}
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleViewUser(user.id)}
                            disabled={isFetchingDetails}
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDIT BTN */}
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <Pencil size={18} />
                          </button>

                          {/* DELETE BTN */}
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {!isLoading && totalPages > 0 && (
                <div className={styles.pagination}>
                  {paginationArray.map((page) => (
                    <button
                      key={page}
                      className={
                        currentPage === page
                          ? styles.activePage
                          : styles.pageBtn
                      }
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

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
                  placeholder="Enter organization name"
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
                  placeholder="Enter email address"
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
                {/* Cho phép xem nhưng disable để không bị sửa đổi */}
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
