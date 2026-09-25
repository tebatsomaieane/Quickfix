import api from "./api";

const USER_STORAGE_KEY = "quickfix_user";

// ==========================================
// REGISTER USER
// ==========================================
export const registerUser = async (userData) => {
    const response = await api.post(
        "/auth/register",
        userData
    );

    return response.data;
};


// ==========================================
// LOGIN USER
// Server sets an httpOnly cookie for the session.
// ==========================================
export const loginUser = async (loginData) => {
    const response = await api.post(
        "/auth/login",
        loginData
    );

    if (response.data.success) {
        cacheUser(response.data.user);
    }

    return response.data;
};


// ==========================================
// LOGOUT USER
// ==========================================
export const logoutUser = async () => {
    try {
        await api.post("/auth/logout");
    } finally {
        clearAuthCache();
    }
};


// ==========================================
// FETCH CURRENT USER (via session cookie)
// /auth/session never 401s for guests — it returns
// { success:false, user:null }, so a logged-out visit
// won't bounce public pages to /login.
// ==========================================
export const fetchCurrentUser = async () => {
    const response = await api.get("/auth/session");

    if (response.data.success) {
        cacheUser(response.data.user);
    }

    return response.data;
};


// ==========================================
// CACHED USER (fast boot, session cookie is
// the source of truth and verified on mount)
// ==========================================
export const getCachedUser = () => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem(USER_STORAGE_KEY);

        return null;
    }
};


export const cacheUser = (user) => {
    localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(user)
    );
};


export const clearAuthCache = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
};


// ==========================================
// CHANGE PASSWORD (authenticated)
// ==========================================
export const changePassword = async (data) => {
    const response = await api.post("/auth/change-password", data);

    return response.data;
};


// ==========================================
// UPDATE PROFILE (authenticated, all roles)
// ==========================================
export const updateProfile = async (data) => {
    const response = await api.patch("/auth/profile", data);

    if (response.data.success && response.data.user) {
        cacheUser(response.data.user);
    }

    return response.data;
};


// ==========================================
// REQUEST PASSWORD RESET (public)
// ==========================================
export const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });

    return response.data;
};


// ==========================================
// RESET PASSWORD WITH TOKEN (public)
// ==========================================
export const resetPassword = async (data) => {
    const response = await api.post("/auth/reset-password", data);

    return response.data;
};


// ==========================================
// VERIFY EMAIL WITH PIN (public)
// ==========================================
export const verifyEmail = async (email, pin) => {
    const response = await api.post(
        "/auth/verify-email",
        { email, pin }
    );

    return response.data;
};


// ==========================================
// RESEND VERIFICATION PIN (public)
// ==========================================
export const resendVerification = async (email) => {
    const response = await api.post("/auth/resend-verification", { email });

    return response.data;
};


// ==========================================
// VERIFY LOGIN 2FA CODE (public, second factor)
// Completes a login after the correct password was entered.
// ==========================================
export const verifyTwoFactor = async (email, pin) => {
    const response = await api.post(
        "/auth/verify-2fa",
        { email, pin }
    );

    if (response.data.success) {
        cacheUser(response.data.user);
    }

    return response.data;
};


// ==========================================
// RESEND LOGIN 2FA CODE (public)
// ==========================================
export const resendOtp = async (email) => {
    const response = await api.post("/auth/resend-otp", { email });

    return response.data;
};