import axios, { AxiosError } from "axios";
import { apiErrorMessage, apiErrorRequestID, isCompanyInactiveError } from "../utils/apiError";

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
        if (axios.isCancel(error)) return Promise.reject(error);
        const { response } = error;

        // Companies settings owns its inline edit/status errors. Other modules
        // must discard already-rendered data after the company becomes inactive.
        if (isCompanyInactiveError(error) && !/^\/companies(?:\/|$)/.test(error.config?.url ?? "")) {
            window.dispatchEvent(new CustomEvent("company-inactive", {
                detail: apiErrorMessage(error, "This company is inactive. Its records are unavailable."),
            }));
        }

        if (!response || response.status >= 500) {
            window.dispatchEvent(new CustomEvent("api-error", {
                detail: {
                    message: apiErrorMessage(error, "Unable to reach the server. Please try again."),
                    requestID: apiErrorRequestID(error),
                },
            }));
        }

        if (response && response.status === 401) {
	            // Prevent infinite redirect loop on login page
            const isLoginPage = window.location.pathname === "/login";

            if (!isLoginPage) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
