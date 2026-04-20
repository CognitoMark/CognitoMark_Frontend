import axios from "axios";
import { storage } from "../utils/storage";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  let token = null;

  if (config.url?.startsWith("/api/admin")) {
    token = storage.get("adminToken");
  } else if (config.url?.startsWith("/api/students") || config.url?.startsWith("/api/sessions") || config.url?.includes("/exams/") || config.url?.includes("/start")) {
    token = storage.get("studentToken");
  } else {
    token = storage.get("studentToken") || storage.get("adminToken");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      if (typeof window !== "undefined") {
        const isAdmin = window.location.pathname.startsWith("/admin");
        
        if (isAdmin) {
          storage.remove("adminToken");
          if (!window.location.pathname.startsWith("/admin/login")) {
            window.location.href = "/admin/login?error=Session expired";
          }
        } else {
          storage.remove("studentToken");
          storage.remove("student");
          if (window.location.pathname !== "/") {
            window.location.href = "/?error=Session expired";
          }
        }
      }
    }

    // Standardize error message extraction
    const message =
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message ||
      "An unexpected error occurred";

    // Attach extracted message for easier consumption in components
    error.errorMessage = message;

    return Promise.reject(error);
  }
);

export default api;
