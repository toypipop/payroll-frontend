import axios, { AxiosError } from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/v1",
    withCredentials: true,
});

// Request interceptor — attach CSRF header on every request
api.interceptors.request.use(
    (config) => {
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        return config;
    },
    (error) => Promise.reject(error),
);

// Response interceptor for 401 errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
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
