import React from "react";
import styles from "./Header.module.css";

const Header = () => {
  const navItems = [
    { id: 1, name: "Dashboard", active: true },
    { id: 2, name: "User Management", active: false },
    { id: 3, name: "System Settings", active: false },
  ];

  return (
    <header className={styles.headerContainer}>
      {/* Group Left: Bao gồm cả Logo và Navigation */}
      <div className="flex items-center gap-12">
        {/* Logo Section */}
        <div className={styles.logoArea}>
          <div className="w-8 h-8 bg-[#FFDA91] rounded-md flex items-center justify-center shadow-inner">
            <div className="w-4 h-4 border-2 border-white rotate-45" />
          </div>
          <span className={styles.logoText}>GoldInsight</span>
        </div>

        {/* Navigation - Bây giờ nó nằm ngay sau Logo */}
        <nav className={styles.navLinks}>
          {navItems.map((item) => (
            <span
              key={item.id}
              className={`${styles.navItem} ${item.active ? styles.activeNavItem : ""}`}
            >
              {item.name}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: User Section - Sẽ được đẩy về phía cuối nhờ justify-between của headerContainer */}
      <div className={styles.userProfile}>
        <img
          src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
          alt="User Avatar"
          className={styles.avatar}
        />
        <span className={styles.statusDot} title="Online"></span>
      </div>
    </header>
  );
};

export default Header;
