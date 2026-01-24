import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Hook để chuyển trang
import styles from "./LoginPage.module.css";
import { FaFacebook, FaTwitter } from "react-icons/fa";
import goldImage from "../../assets/image/gold-coin.png";
import { MOCK_USERS } from "../../mockup/mockUser"; 

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Tìm kiếm user trong đống dữ liệu cứng
    const user = MOCK_USERS.find(
      (u) => u.email === email && u.password === password,
    );

    if (user) {
      if (user.role === "admin") {
        navigate("/admin-dashboard"); // Chuyển sang Admin nếu đúng role
      } else {
        alert("Chào Investor! Trang của bạn đang được xây dựng.");
      }
    } else {
      setError("Email hoặc mật khẩu không đúng rồi bro!");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftSide}>
        <div className={styles.leftContent}>
          <h1 className={styles.leftTitle}>Hello, Friend!</h1>
          <p className={styles.leftDesc}>
            Fill up personal information and start journey with us
          </p>
          <button className={styles.signupBtn}>Sign up</button>
        </div>
      </div>

      <div className={styles.centerCircle}>
        <img src={goldImage} alt="Gold Background" />
      </div>

      <div className={styles.rightSide}>
        <div className={styles.loginCard}>
          <h2 className={styles.brandTitle}>GoldInsight</h2>

          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email</label>
              <input
                type="email"
                placeholder="admin@goldinsight.com"
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <input
                type="password"
                placeholder="admin"
                className={styles.inputField}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <p className="text-red-500 text-[10px] mt-2 ml-1 italic">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" className={styles.loginBtn}>
              Login
            </button>
          </form>

          <div className={styles.socialIcons}>
            <FaFacebook size={26} className={styles.socialIcon} />
            <div className={styles.googleIcon}></div>
            <FaTwitter size={26} className={styles.socialIcon} />
          </div>

          <div className={styles.footerSection}>
            <p className={styles.footerText}>Don't have an account?</p>
            <span className={styles.registerLink}>Register</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
