import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const backendApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const getBackendHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

/**
 * Get current user profile
 * @returns {Promise<any>}
 */
export const getUserProfile = async () => {
  const headers = getBackendHeaders();
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
  const headers = {
    ...getBackendHeaders(),
    "Content-Type": "multipart/form-data",
  };
  
  const formData = new FormData();
  formData.append("file", file);

  const response = await backendApi.patch(
    "/me/avatar",
    formData,
    { headers }
  );
  return response.data;
};
