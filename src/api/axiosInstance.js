import axios from "axios";

const api = axios.create({
    // Use the environment variable from .env file
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
    (config) => config,
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
                localStorage.removeItem("user");

                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
