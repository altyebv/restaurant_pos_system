import axios from "axios";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const backendUrl = import.meta?.env?.VITE_BACKEND_URL || "http://localhost:3000";

export const axiosWrapper = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: { ...defaultHeader },
});

// Request interceptor to attach auth token to every request
axiosWrapper.interceptors.request.use(
  (config) => {
    // Get token from localStorage (or wherever you store it)
    const token = localStorage.getItem("token"); // Adjust this key if needed
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
axiosWrapper.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401, the token might be expired
    if (error.response?.status === 401) {
      // Optionally clear token and redirect to login
      localStorage.removeItem("token");
      // You might want to dispatch a Redux action here to clear user state
      // window.location.href = '/auth'; // Uncomment if you want auto-redirect
    }
    return Promise.reject(error);
  }
);