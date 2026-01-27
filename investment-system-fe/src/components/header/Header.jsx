import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";

const Header = ({ role = "GUEST" }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để check xem trang nào đang active

  // Cấu hình menu cho từng Role
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

        {/* Navigation - Thay đổi linh hoạt theo Role */}
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
          <div className={styles.userProfile}>
            <img
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
              alt="User Avatar"
              className={styles.avatar}
            />
            <span className={styles.statusDot} title="Online"></span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
