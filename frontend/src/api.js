import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

// 🔥 Automatically attach token only for voters
API.interceptors.request.use(
  (config) => {
    const userType = localStorage.getItem("userType"); // 'voter' or 'admin'
    const token = localStorage.getItem("token");

    if (userType === "voter" && token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
