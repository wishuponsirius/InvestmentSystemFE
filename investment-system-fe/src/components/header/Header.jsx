import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

const Header = ({ role = "GUEST" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // State quản lý việc mở/đóng dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    INVESTOR: [
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

  const currentMenu = menuConfig[role] || menuConfig.GUEST;

  const handleLogout = () => {
    setIsDropdownOpen(false);
    // Xử lý logic xóa token/auth ở đây
    navigate("/login");
  };

  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    // Điều hướng tới trang settings tùy theo role
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
        {role === "GUEST" ? (
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
            <img
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
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
