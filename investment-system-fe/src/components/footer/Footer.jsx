import React from "react";
import styles from "../footer/Footer.module.css";
import { Github, Twitter, Linkedin } from "lucide-react"; // Sử dụng lucide-react cho icon

const Footer = () => {
  const footerData = [
    {
      title: "Company",
      links: ["About Us", "Careers", "Press"],
    },
    {
      title: "Support",
      links: [
        "Help Center",
        "Contact Us",
        "Privacy Policy",
        "Terms of Service",
      ],
    },
    {
      title: "Resources",
      links: ["Blog", "Market Reports", "FAQ"],
    },
  ];

  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.footerGrid}>
        {/* Brand Column */}
        <div className={styles.brandColumn}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFDA91] rounded-md flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rotate-45" />
            </div>
            <span className="font-bold text-xl text-[#FFDA91]">
              GoldInsight
            </span>
          </div>
          <p className={styles.brandDescription}>
            GoldInsight: Your trusted partner for precious metals analysis and
            portfolio tracking.
          </p>
          <div className={styles.socialLinks}>
            <Github className={styles.socialIcon} size={20} />
            <Twitter className={styles.socialIcon} size={20} />
            <Linkedin className={styles.socialIcon} size={20} />
          </div>
        </div>

        {/* Dynamic Columns */}
        {footerData.map((column, index) => (
          <div key={index}>
            <h4 className={styles.columnTitle}>{column.title}</h4>
            <ul className={styles.linkList}>
              {column.links.map((link, linkIndex) => (
                <li key={linkIndex} className={styles.footerLink}>
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className={styles.copyrightSection}>
        <p className={styles.copyrightText}>
          © 2026 GoldInsight. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer; /*  */
