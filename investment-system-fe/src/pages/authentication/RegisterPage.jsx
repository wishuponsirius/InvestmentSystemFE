import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./RegisterPage.module.css";
import { FaFacebook, FaTwitter } from "react-icons/fa";
import goldImage from "../../assets/image/gold-coin.png";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!orgName || !email || !password) {
      setError("Full name, email, and password are required.");
      setIsLoading(false);
      return;
    }

    try {
      // Call registration API
      const requestPayload = {
        orgName: orgName,
        contactEmail: email,
        password: password,
      };

      if (avatarUrl) {
        requestPayload.avatarUrl = avatarUrl;
      }

      const response = await axios.post("http://localhost:8080/auth/register", requestPayload);

      const payload = response.data?.data || response.data;

      // Save tokens to localStorage
      if (payload.accessToken) {
        localStorage.setItem("accessToken", payload.accessToken);
      }
      if (payload.refreshToken) {
        localStorage.setItem("refreshToken", payload.refreshToken);
      }

      // Success message
      setSuccess("Registration successful!");

      // Redirect based on user role
      let userRole = payload.role;

      if (!userRole && payload.user && payload.user.role) {
        userRole = payload.user.role;
      }
      if (!userRole && Array.isArray(payload.roles) && payload.roles.length > 0) {
        userRole = payload.roles[0];
      }

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
      if (err.response) {
        setError(
          err.response.data?.message || "Registration failed! Please try again."
        );
      } else if (err.request) {
        setError("Cannot connect to server. Please try again later.");
      } else {
        setError("An error occurred during registration.");
      }
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className={styles.registerContainer}>
      {/* Left Side - Registration Form */}
      <div className={styles.leftSide}>
        <div className={styles.registerCard}>
          <h2 className={styles.cardTitle}>Create Your Account</h2>

          <form onSubmit={handleRegister}>
            {/* Full Name Field */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className={styles.inputField}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            {/* Email Field */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email</label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Avatar URL Field (optional) */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Avatar URL (optional)</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                className={styles.inputField}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
            </div>

            {/* Password Field */}
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
            </div>

            {/* Alerts */}
            {error && (
              <p className="text-red-500 text-[12px] mt-2 ml-1 italic">
                {error}
              </p>
            )}
            {success && (
              <p className="text-yellow-600 bg-yellow-100 px-3 py-2 rounded-lg mt-2 text-[12px]">
                {success}
              </p>
            )}

            {/* Register Button */}
            <button
              type="submit"
              className={styles.registerBtn}
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Register Account"}
            </button>
          </form>

          {/* Social Login Icons */}
          <div className={styles.socialIcons}>
            <FaFacebook size={26} className={styles.socialIcon} />
            <div className={styles.googleIcon}></div>
            <FaTwitter size={26} className={styles.socialIcon} />
          </div>

          {/* Footer - Link to Login */}
          <div className={styles.footerSection}>
            <p className={styles.footerText}>Already have an account?</p>
            <span 
              className={styles.loginLink}
              onClick={handleSignIn}
              style={{ cursor: "pointer" }}
            >
              Login
            </span>
          </div>
        </div>
      </div>

      {/* Profile Circle - spanning between left and right */}
      <div className={styles.profileCircle}>
        <img src={goldImage} alt="Gold" />
      </div>

      {/* Right Side - Yellow Background with Welcome Message */}
      <div className={styles.rightSide}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>Welcome back!</h1>
          <p className={styles.welcomeDesc}>
            To keep connected with us please login with your personal information.
          </p>
          <button className={styles.signInBtn} onClick={handleSignIn}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
