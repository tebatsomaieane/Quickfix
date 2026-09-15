import axios from "axios";

// Production builds talk to the same origin (the server proxies /api),
// so "/api" is the correct default. Set VITE_API_URL only when the API
// is served from a different origin.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Strip a trailing slash so URL joins stay predictable.
const baseURL = API_BASE_URL.replace(/\/+$/, "");

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});

// Global 401 handling: an invalid/expired session means the request failed
// for the whole app, so bounce the user to /login once.
let redirectingToLogin = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";

        // Only treat real session failures as needing a login bounce.
        // /auth/session and /auth/me are passive session probes — they
        // legitimately report "not logged in" and must never redirect.
        if (
            status === 401 &&
            !url.includes("/auth/login") &&
            !url.includes("/auth/register") &&
            !url.includes("/auth/forgot-password") &&
            !url.includes("/auth/reset-password") &&
            !url.includes("/auth/session") &&
            !url.includes("/auth/me")
        ) {
            if (!redirectingToLogin && !window.location.pathname.startsWith("/login")) {
                redirectingToLogin = true;
                window.location.assign("/login?expired=1");
                setTimeout(() => { redirectingToLogin = false; }, 1500);
            }
        }

        return Promise.reject(error);
    }
);

export default api;