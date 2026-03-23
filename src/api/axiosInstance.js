import axios from "axios";

const api = axios.create({
    // Use the environment variable from .env file
    baseURL: `${import.meta.env.VITE_API_URL}`,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
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

// Response interceptor for 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;

        if (response && response.status === 401) {
            // Prevent infinite redirect loop on login page
            const isLoginPage = window.location.pathname === "/login";

            if (!isLoginPage) {
                // Clear stored auth tokens
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // Redirect to login if not already there
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;