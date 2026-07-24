import axios from "axios";
import { getUserFromStorage } from "../utils/userStorage";

const API_BASE_URL = "http://localhost:8080";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically add X-User-Id to all protected requests
axiosClient.interceptors.request.use(
  (config) => {
    const user = getUserFromStorage();
    if (user?.id) {
      config.headers["X-User-Id"] = String(user.id);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401/403 redirects
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function getUserId() {
  const user = getUserFromStorage();
  return user?.id || null;
}

export function getUserRole() {
  const user = getUserFromStorage();
  return user?.role?.roleName?.toUpperCase() || "EMPLOYEE";
}

export default axiosClient;
