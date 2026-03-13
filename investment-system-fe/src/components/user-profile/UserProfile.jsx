import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Bell,
  ArrowDownCircle,
  ArrowRightCircle,
  Box,
  Users,
  Sun, // Thêm icon Sun cho Appearance
  X,
  MapPin,
  UserPen,
  ArrowLeft,
} from "lucide-react";
import styles from "./UserProfile.module.css";
import * as userService from "../../services/userService";

const UserProfile = () => {
  const navigate = useNavigate();
  // State quản lý tab đang mở (Mặc định là Edit profile)
  const [activeTab, setActiveTab] = useState("Edit profile");

  // State cho thông tin người dùng
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // State cho đổi mật khẩu
  const [passwords, setPasswords] = useState({
    old: "",
    new: "",
    confirm: "",
  });

  // Fetch user profile on mount
  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const resp = await userService.getUserProfile();
      if (resp.success) {
        setUser(resp.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showMessage("error", "New passwords do not match!");
      return;
    }
    if (passwords.new.length < 8) {
      showMessage("error", "New password must be at least 8 characters!");
      return;
    }

    setLoading(true);
    try {
      const resp = await userService.changePassword(passwords.old, passwords.new);
      if (resp.success) {
        showMessage("success", "Password changed successfully!");
        setPasswords({ old: "", new: "", confirm: "" });
      } else {
        showMessage("error", resp.message || "Failed to change password.");
      }
    } catch (err) {
      showMessage("error", err.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "File size must be less than 5MB");
      return;
    }

    setLoading(true);
    try {
      const resp = await userService.uploadAvatar(file);
      if (resp.success) {
        showMessage("success", "Avatar updated successfully!");
        setUser(resp.data); // Update user profile with new avatarUrl
      } else {
        showMessage("error", resp.message || "Failed to upload avatar.");
      }
    } catch (err) {
      showMessage("error", err.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const sidebarTabs = [
    { name: "Edit profile", icon: User },
    { name: "Password", icon: Lock },
    { name: "Notifications", icon: Bell },
    { name: "Chat export", icon: ArrowDownCircle },
    { name: "Sessions", icon: ArrowRightCircle },
    { name: "Applications", icon: Box },
    { name: "Team", icon: Users },
    { name: "Appearance", icon: Sun }, // Cập nhật theo ảnh mới
  ];

  // Hàm render giao diện Edit Profile
  const renderEditProfile = () => (
    <div className={styles.formContainer}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Avatar</label>
        <div className={styles.avatarSection}>
          <div className={styles.avatarCircle}>
            <img 
              src={user?.avatarUrl || "https://i.pravatar.cc/150?img=11"} 
              alt="User Avatar" 
            />
          </div>
          <div className={styles.avatarActions}>
            <label className={styles.uploadBtn} style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? "Uploading..." : "Upload new image"}
              <input 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={handleAvatarUpload}
                disabled={loading}
              />
            </label>
            <p className={styles.helperText}>
              At least 800×800 px recommended.<br />
              JPG or PNG and GIF is allowed
            </p>
          </div>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Name</label>
        <div className={styles.inputWrapper}>
          <User className={styles.inputIcon} size={18} />
          <input
            type="text"
            placeholder="Username or email"
            className={`${styles.input} ${styles.inputGray}`}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Location</label>
        <div className={styles.inputWrapper}>
          <MapPin className={styles.inputIcon} size={18} />
          <input
            type="text"
            defaultValue="Sai Gon, Vietnam"
            className={`${styles.input} ${styles.inputWhite}`}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Bio</label>
          <span className={styles.charCount}>880</span>
        </div>
        <div className={styles.inputWrapper}>
          <UserPen className={styles.textareaIcon} size={18} />
          <textarea
            placeholder="Short bio"
            className={`${styles.textarea} ${styles.inputGray}`}
          ></textarea>
        </div>
      </div>

      <button className={styles.submitBtn}>Save changes</button>
    </div>
  );

  // Hàm render giao diện Password
  const renderPassword = () => (
    <form className={styles.formContainer} onSubmit={handlePasswordChange}>
      <div className={styles.formGroup}>
        <label className={styles.label}>Old password</label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} />
            <input
              type="password"
              placeholder="Password"
              className={`${styles.input} ${styles.inputGray}`}
              value={passwords.old}
              onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
              required
            />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>New password</label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} />
            <input
              type="password"
              placeholder="New password"
              className={`${styles.input} ${styles.inputGray}`}
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              required
            />
        </div>
        <p className={styles.hintText}>Minimum 8 characters</p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Confirm new password</label>
        <div className={styles.inputWrapper}>
          <Lock className={styles.inputIcon} size={18} />
            <input
              type="password"
              placeholder="Confirm new password"
              className={`${styles.input} ${styles.inputGray}`}
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
            />
          </div>
          <p className={styles.hintText}>Minimum 8 characters</p>
        </div>

        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={loading}
        >
          {loading ? "Changing..." : "Change password"}
        </button>
      </form>
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.cardContainer}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <nav className={styles.navMenu}>
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ""}`}
                  // Đổi state activeTab khi click
                  onClick={() => setActiveTab(tab.name)}
                >
                  <Icon size={18} className={styles.navIcon} />
                  {tab.name}
                </button>
              );
            })}

            <div className={styles.sidebarDivider}></div>

            <button className={`${styles.navBtn} ${styles.dangerBtn}`}>
              <X size={18} className={styles.navIcon} />
              Delete account
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <section className={styles.contentArea}>
          {/* Tiêu đề thay đổi động theo tab */}
          <h1 className={styles.pageTitle}>{activeTab}</h1>

          {/* Alert Message */}
          {msg.text && (
            <div className={`${styles.alert} ${msg.type === "success" ? styles.alertSuccess : styles.alertError}`}>
              {msg.text}
            </div>
          )}

          {/* Dùng điều kiện để render form tương ứng */}
          {activeTab === "Edit profile" && renderEditProfile()}
          {activeTab === "Password" && renderPassword()}
          
          {/* Thông báo phụ cho các tab chưa có thiết kế */}
          {activeTab !== "Edit profile" && activeTab !== "Password" && (
            <div className={styles.placeholderText}>
              Content for {activeTab} will be displayed here.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfile;