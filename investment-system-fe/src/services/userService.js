import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Axios interceptor để tự động thêm headers cho mọi request
backendApi.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  
  if (accessToken) {
    // Thêm Authorization header
    config.headers.Authorization = `Bearer ${accessToken}`;
    
    // Thêm X-User-Email header cho IAM service
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "===".slice((base64.length + 3) % 4);
        const payload = JSON.parse(atob(padded));
        
        // Ưu tiên email trước sub (vì sub thường là UUID)
        const email = payload.email || payload.contactEmail || payload.sub;
        if (email) {
          config.headers["X-User-Email"] = email;
        }
      }
    } catch (e) {
      console.error("Error decoding token in interceptor:", e);
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * Get current user profile
 * @returns {Promise<any>}
 */
export const getUserProfile = async () => {
  const response = await backendApi.get("/me");
  return response.data;
};

/**
 * Change user password
 * @param {string} currentPassword 
 * @param {string} newPassword 
 * @returns {Promise<any>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await backendApi.patch(
    "/me/password",
    { currentPassword, newPassword }
  );
  return response.data;
};

/**
 * Upload profile avatar
 * @param {File} file 
 * @returns {Promise<any>}
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await backendApi.patch(
    "/me/avatar",
    formData
  );
  return response.data;
};
