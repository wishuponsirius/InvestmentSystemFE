import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import Axios
import styles from "./LoginPage.module.css";
import { FaFacebook, FaTwitter } from "react-icons/fa";
import goldImage from "../../assets/image/gold-coin.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Reset lỗi
    setIsLoading(true);

    try {
      // Gọi API bằng Axios
      const response = await axios.post("http://localhost:8080/auth/login", {
        contactEmail: email, // Key theo chuẩn của Swagger UI
        password: password,
      });

      // Axios tự động parse JSON; payload thực tế có thể nằm trong response.data.data
      const payload = response.data?.data || response.data;

      // Lưu Token vào localStorage (bạn kiểm tra lại tên field trả về từ backend nhé)
      if (payload.accessToken) {
        localStorage.setItem("accessToken", payload.accessToken);
      }
      if (payload.refreshToken) {
        localStorage.setItem("refreshToken", payload.refreshToken);
      }

      // Xử lý chuyển trang dựa trên Role
      // Không mặc định thành 'admin' nếu backend không trả role.
      let userRole = payload.role;

      // Thêm một số fallback phổ biến từ API: payload.user.role hoặc payload.roles
      if (!userRole && payload.user && payload.user.role) {
        userRole = payload.user.role;
      }
      if (!userRole && Array.isArray(payload.roles) && payload.roles.length > 0) {
        userRole = payload.roles[0];
      }

      // Nếu backend chỉ trả token, cố decode payload từ accessToken (JWT) để lấy role
      if (!userRole && payload.accessToken) {
        try {
          const parts = payload.accessToken.split('.');
          if (parts.length === 3) {
            const jwtPayload = JSON.parse(atob(parts[1]));
            userRole = jwtPayload.role || (Array.isArray(jwtPayload.roles) && jwtPayload.roles[0]);
          }
        } catch {
          // ignore decode errors
        }
      }

      // Nếu vẫn không có role, coi là GUEST thay vì mặc định admin
      if (!userRole) {
        userRole = "GUEST";
      }

      const roleLower = String(userRole).toLowerCase();
      if (roleLower === "admin") {
        navigate("/admin-dashboard");
      } else if (roleLower === "institution") {
        navigate("/investor-dashboard");
      } else if (roleLower === "guest" || roleLower === "user") {
        navigate("/guest-dashboard");
      } else {
        alert("Hello! Your page is under construction.");
      }
    } catch (err) {
      // Bắt lỗi từ Axios
      if (err.response) {
        // Lỗi do server trả về (vd: 401 Unauthorized, 400 Bad Request)
        // Thường backend sẽ có kèm message lỗi trong err.response.data.message
        setError(
          err.response.data?.message || "Email or Password is incorrect!",
        );
      } else if (err.request) {
        // Lỗi không nhận được phản hồi (server sập, mất mạng)
        setError("Cannot connect to server. Please try again later.");
      } else {
        // Lỗi lúc setup request
        setError("An error occurred during login.");
      }
    } finally {
      setIsLoading(false); // Tắt trạng thái loading
    }
  };

  const handleRegister = () => {
    navigate("/register");
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
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                className={styles.inputField}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {/* Vùng hiển thị lỗi */}
              {error && (
                <p className="text-red-500 text-[10px] mt-2 ml-1 italic">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className={styles.socialIcons}>
            <FaFacebook size={26} className={styles.socialIcon} />
            <div className={styles.googleIcon}></div>
            <FaTwitter size={26} className={styles.socialIcon} />
          </div>

          <div className={styles.footerSection}>
            <p className={styles.footerText}>Don't have an account?</p>
            <span 
              className={styles.registerLink}
              onClick={handleRegister}
              style={{ cursor: "pointer" }}
            >
              Register
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
