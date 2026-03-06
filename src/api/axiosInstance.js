import axios from "axios";

const api = axios.create({
    // Use the environment variable from .env file
    baseURL: import.meta.env.VITE_API_URL,
});

/* --- Request Interceptor (English Comment) --- */
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

/* --- Response Interceptor for handling 401 (English Comment) --- */
/* --- Response Interceptor for handling 401 (English Comment) --- */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;

        if (response && response.status === 401) {
            // Check if we are already on the login page to prevent infinite loop (English Comment)
            const isLoginPage = window.location.pathname === "/login";

            if (!isLoginPage) {
                // Clear local storage (English Comment)
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                // Redirect only if not already on login page (English Comment)
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;