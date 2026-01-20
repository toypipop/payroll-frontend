import axios from "axios";
const api = axios.create({
    // Use the environment variable from .env file
    baseURL: import.meta.env.VITE_API_URL,
});

// Request Interceptor: Attach JWT Token before every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default api;
