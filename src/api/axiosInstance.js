import axios from "axios";
const api = axios.create({
    // Use the environment variable from .env file
    baseURL: import.meta.env.VITE_API_URL,
});

/* --- Update api.js (English Comment) --- */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            // Use set method or direct assignment (English Comment)
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${token}`,
            };
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default api;
