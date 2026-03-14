import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

const Header = ({ role = "GUEST" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Normalize incoming role: accept lower/upper case and synonyms
  const incomingRole = role || "GUEST";
  const roleUpper = String(incomingRole).toUpperCase();
  // Map synonyms: treat INVESTOR same as INSTITUTION
  const mappedRole = roleUpper === "INVESTOR" ? "INSTITUTION" : roleUpper;

  // State quản lý việc mở/đóng dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const dropdownRef = useRef(null);

  // Lấy tên hiển thị (username) và avatar từ localStorage để hiển thị bên cạnh avatar
  useEffect(() => {
    const cachedName = localStorage.getItem("displayName");
    if (cachedName) {
      setUserName(cachedName);
    }

    const cachedAvatar = localStorage.getItem("avatarUrl");
    if (cachedAvatar) {
      setAvatarUrl(cachedAvatar);
    }

    if (!cachedName) {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const parts = token.split(".");
        if (parts.length !== 3) return;

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "===".slice((base64.length + 3) % 4);
        const payload = JSON.parse(atob(padded));

        const name =
          payload?.username ||
          payload?.preferred_username ||
          payload?.orgName ||
          payload?.name ||
          payload?.email ||
          payload?.sub;

        const finalName = name || "";
        setUserName(finalName);
        if (finalName) localStorage.setItem("displayName", finalName);
      } catch (e) {
        console.error("Failed to decode access token:", e);
      }
    }

    const updateFromStorage = () => {
      setUserName(localStorage.getItem("displayName") || "");
      setAvatarUrl(localStorage.getItem("avatarUrl") || "");
    };

    window.addEventListener("storage", updateFromStorage);
    window.addEventListener("avatarUpdated", updateFromStorage);

    return () => {
      window.removeEventListener("storage", updateFromStorage);
      window.removeEventListener("avatarUpdated", updateFromStorage);
    };
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuConfig = {
    GUEST: [
      { name: "Market Data", path: "/guest-dashboard" },
      { name: "About Us", path: "/about" },
    ],
    INSTITUTION: [
      { name: "Market Data", path: "/investor-dashboard" },
      { name: "Portfolio", path: "/portfolio" },
      { name: "Analytics", path: "/analytics" },
      { name: "News", path: "/news" },
    ],
    ADMIN: [
      { name: "Dashboard", path: "/admin-dashboard" },
      { name: "User Management", path: "/user-management" },
      { name: "System Settings", path: "/system-settings" },
    ],
  };

  const currentMenu = menuConfig[mappedRole] || menuConfig.GUEST;

  const handleLogout = () => {
    setIsDropdownOpen(false);

    // Xóa toàn bộ token khỏi localStorage để thực sự đăng xuất
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Đẩy người dùng về trang đăng nhập
    navigate("/login");
  };

  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    // Điều hướng tới trang User Profile mà chúng ta vừa tạo
    navigate("/user-profile");
  };

  return (
    <header className={styles.headerContainer}>
      {/* Group Left: Logo + Navigation */}
      <div className="flex items-center gap-12">
        {/* Logo Section */}
        <div
          className={styles.logoArea}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="w-8 h-8 bg-[#FFDA91] rounded-md flex items-center justify-center shadow-inner">
            <div className="w-4 h-4 border-2 border-white rotate-45" />
          </div>
          <span className={styles.logoText}>GoldInsight</span>
        </div>

        {/* Navigation */}
        <nav className={styles.navLinks}>
          {currentMenu.map((item, index) => (
            <span
              key={index}
              onClick={() => navigate(item.path)}
              className={`${styles.navItem} ${
                location.pathname === item.path ? styles.activeNavItem : ""
              }`}
            >
              {item.name}
            </span>
          ))}
        </nav>
      </div>

      {/* Right Section: User Profile hoặc Login Button */}
      <div className="flex items-center gap-4">
        {mappedRole === "GUEST" ? (
          <button
            className={styles.loginBtn}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        ) : (
          <div
            className={styles.userProfile}
            ref={dropdownRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className={styles.welcomeText}>
              Welcome{userName ? `, ${userName}` : ""}
            </span>
            <img
              src={avatarUrl || "https://i.pravatar.cc/150?u=a042581f4e29026704d"}
              alt="User Avatar"
              className={styles.avatar}
            />
            <span className={styles.statusDot} title="Online"></span>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div
                  className={styles.dropdownItem}
                  onClick={handleProfileSettings}
                >
                  Profile Settings
                </div>
                <div
                  className={`${styles.dropdownItem} ${styles.dropdownItemLogout}`}
                  onClick={handleLogout}
                >
                  Log out
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
