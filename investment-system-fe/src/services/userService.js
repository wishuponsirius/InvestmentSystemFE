import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const getBackendHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  
  // Trích xuất email từ token để gửi header X-User-Email (Yêu cầu của IAM Backend)
  if (accessToken) {
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const email = payload.sub || payload.email || payload.contactEmail;
        if (email) {
          headers["X-User-Email"] = email;
        }
      }
    } catch (e) {
      console.error("Error decoding token for X-User-Email:", e);
    }
  }
  
  return headers;
};

/**
 * Get current user profile
 * @returns {Promise<any>}
 */
export const getUserProfile = async () => {
  const headers = getBackendHeaders();
  // Endpoint đúng trong AccountController.java là GET /me (RequestMapping("/me") và GetMapping không path)
  const response = await backendApi.get("/me", { headers });
  return response.data;
};

/**
 * Change user password
 * @param {string} currentPassword 
 * @param {string} newPassword 
 * @returns {Promise<any>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  const headers = getBackendHeaders();
  const response = await backendApi.patch(
    "/me/password",
    { currentPassword, newPassword },
    { headers }
  );
  return response.data;
};

/**
 * Upload profile avatar
 * @param {File} file 
 * @returns {Promise<any>}
 */
export const uploadAvatar = async (file) => {
  const headers = getBackendHeaders();
  
  const formData = new FormData();
  formData.append("file", file);

  const response = await backendApi.patch(
    "/me/avatar",
    formData,
    { headers }
  );
  return response.data;
};
