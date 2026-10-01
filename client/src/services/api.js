import axios from "axios";
import {
    reportApiUnreachable,
    reportApiReachable
} from "../lib/connectivity";

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

// A short in-memory cache for safe GETs. Dashboard and catalogue screens
// refetch the same lists on every mount and every filter tweak; serving a
// recent copy removes a visible loading state and the request behind it.
// Kept deliberately small and short-lived, and only for endpoints that are
// known not to change minute-to-minute.
const CACHE_TTL_MS = 30_000;
const responseCache = new Map();

const isCacheable = (config) => {
    const method = (config.method || "get").toLowerCase();

    if (method !== "get") return false;
    if (config.params && Object.keys(config.params).length > 0) return false;

    const url = config.url || "";

    // Catalogue and session-adjacent reads only. Anything that reflects
    // private user state, or can be mutated by another user (messages, offers,
    // jobs) is excluded, so a stale read can never show the wrong thing.
    return /^\/(categories|services|providers|products|market)/.test(url);
};

api.interceptors.request.use(async (config) => {
    const cacheKey = `${config.method || "get"}:${config.url}`;

    if (isCacheable(config)) {
        const hit = responseCache.get(cacheKey);

        if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
            // Answered by overriding the adapter rather than short-circuiting
            // the promise, so the response still passes through the normal
            // response interceptors and callers see an ordinary Axios response.
            const cached = hit.response;

            return {
                ...config,
                adapter: () =>
                    Promise.resolve({
                        data: cached.data,
                        status: cached.status,
                        statusText: cached.statusText,
                        headers: cached.headers,
                        config
                    })
            };
        }
    }

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
    (response) => {
        // Reaching the API at all proves it is up. This is what clears the
        // "can't reach QuickFix" banner once a server recovers.
        reportApiReachable();

        // A successful write may have changed what a cached catalogue read
        // would return, so the cache is dropped rather than trusted for the
        // next 30 seconds. Deliberately blunt: one extra fetch is far cheaper
        // than showing a user a service or price that no longer exists.
        const method = (response.config?.method || "get").toLowerCase();

        if (response.config && method !== "get") {
            responseCache.clear();

            return response;
        }

        // Populate the cache. Guarded on config, which is absent on cache hits.
        if (response.config && isCacheable(response.config)) {
            responseCache.set(
                `${(response.config.method || "get").toLowerCase()}:${response.config.url}`,
                {
                    at: Date.now(),
                    response: {
                        data: response.data,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    }
                }
            );
        }

        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";

        // No response at all means the request never completed: offline, DNS
        // failure, or the API asleep. A 4xx/5xx is a real answer from a server
        // that is up, so it must not raise a connectivity warning.
        if (!error.response) {
            reportApiUnreachable();
        }

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