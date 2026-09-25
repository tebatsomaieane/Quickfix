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

// Real-time streams (EventSource) need the same base URL. EventSource can't
// set custom headers, so auth relies on the httpOnly session cookie - the
// same cookie every other API call uses.
export const getApiBaseUrl = () => baseURL;

// ==========================================
// CSRF protection
// The API echoes a csrfToken cookie back on every state-changing request.
// We fetch the token once at startup (CORS prevents attackers from doing
// the same) and replay it as x-csrf-token on all non-GET requests.
// ==========================================
let csrfToken = null;
let csrfPending = null;

const fetchCsrfToken = () => {
    if (csrfToken) return Promise.resolve(csrfToken);

    if (!csrfPending) {
        csrfPending = axios
            .get(`${baseURL}/csrf`, { withCredentials: true })
            .then((res) => {
                csrfToken = res.data?.data?.token || null;

                return csrfToken;
            })
            .catch(() => null)
            .finally(() => {
                csrfPending = null;
            });
    }

    return csrfPending;
};

api.interceptors.request.use(async (config) => {
    const method = (config.method || "get").toLowerCase();

    if (method !== "get" && method !== "head" && method !== "options") {
        const token = await fetchCsrfToken();

        if (token) {
            config.headers["x-csrf-token"] = token;
        }
    }

    return config;
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
            !url.includes("/auth/verify-email") &&
            !url.includes("/auth/resend-verification") &&
            !url.includes("/auth/verify-2fa") &&
            !url.includes("/auth/resend-otp") &&
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