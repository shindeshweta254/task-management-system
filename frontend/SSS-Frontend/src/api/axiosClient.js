import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "./index";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();

    config.headers = {
      ...(config.headers || {}),
      ...authHeaders,
    };

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.error(
        "401 Unauthorized:",
        "axiosClient.js:",
        "Intercepted by axiosClient.js. ",
            "No automatic redirect to login page from axios interceptor.", // Explicitly confirm no redirect
        error?.config?.url,
        error?.response?.data
      );

      // IMPORTANT:
      // Do NOT clear token here.
      // Do NOT redirect to login here.
      //
      // We will fix the actual JWT/Spring Security
      // 401 issue separately.
    }

    return Promise.reject(error);
  }
);

export default axiosClient;