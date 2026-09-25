const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
    sendPasswordResetEmail,
    sendEmailVerificationPin,
    sendLoginOtp
} = require("../utils/email");

const JWT_MAX_AGE = 60 * 60 * 24; // 1 day in seconds

const BCRYPT_ROUNDS = 10;

// One-time PIN (registration email verification + login 2FA).
const OTP_LENGTH = 6;
const OTP_WINDOW_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Generate a cryptographically random N-digit PIN, zero-padded.
const generateOtp = () =>
    crypto
        .randomInt(0, Math.pow(10, OTP_LENGTH))
        .toString()
        .padStart(OTP_LENGTH, "0");

// PINs are stored as SHA-256 hashes, never plaintext.
const hashOtp = (pin) =>
    crypto.createHash("sha256").update(pin).digest("hex");

// Constant-time comparison of two token hashes.
const safeEqual = (a, b) => {
    if (typeof a !== "string" || typeof b !== "string") {
        return false;
    }

    const left = Buffer.from(a);
    const right = Buffer.from(b);

    return left.length === right.length
        && crypto.timingSafeEqual(left, right);
};

const otpExpiry = () => new Date(Date.now() + OTP_WINDOW_MINUTES * 60 * 1000);

const isValidOtp = (pin) => /^\d{6}$/.test(String(pin).trim());

// Whether sign-in is blocked until the account's email is verified.
const emailVerificationRequired = () =>
    process.env.REQUIRE_EMAIL_VERIFICATION === "true";

// Anti-spam: at most one OTP resend per email per window.
const OTP_RESEND_WINDOW_MS = 60 * 1000;
const otpResendCooldowns = new Map(); // email -> last attempt timestamp

// Records an OTP resend attempt for `email` and returns the remaining
// cooldown in ms (0 when the resend is allowed right now). Runs on the
// raw email string BEFORE any account lookup so it behaves identically
// for unknown and existing accounts - a 429 can never reveal whether an
// email is registered. Attempts are recorded even when blocked, so an
// attacker cannot reset the window by spamming.
const consumeOtpResendCooldown = (email) => {
    const now = Date.now();
    const last = otpResendCooldowns.get(email) || 0;

    otpResendCooldowns.set(email, now);

    if (otpResendCooldowns.size > 5000) {
        for (const [key, ts] of otpResendCooldowns) {
            if (now - ts >= OTP_RESEND_WINDOW_MS) {
                otpResendCooldowns.delete(key);
            }
        }
    }

    return Math.max(0, OTP_RESEND_WINDOW_MS - (now - last));
};

const COOKIE_OPTIONS = {
    httpOnly: true,
    // "lax" is the default and our CSRF mitigation for same-origin
    // deployments. Cross-site clients (e.g. the app hosted on Vercel
    // talking to this API on Railway) must set COOKIE_SAMESITE=none so
    // the browser accepts and returns the session cookie.
    sameSite: process.env.COOKIE_SAMESITE || "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: JWT_MAX_AGE * 1000,
    path: "/"
};

const register = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone,
            password,
            role
        } = req.body;

        if (!first_name || !last_name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        const allowedRoles = [
            "CUSTOMER",
            "PROVIDER",
            "BUSINESS_OWNER"
        ];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        const firstName = first_name.trim();
        const lastName = last_name.trim();
        const emailValue = email.trim().toLowerCase();
        const phoneValue = (phone || "").trim();

        if (!firstName || !lastName || !phoneValue) {
            return res.status(400).json({
                success: false,
                message: "First name, last name and phone number are required"
            });
        }

        if (firstName.length > 100 || lastName.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Names must be 100 characters or fewer"
            });
        }

        if (emailValue.length > 255) {
            return res.status(400).json({
                success: false,
                message: "Email must be 255 characters or fewer"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(emailValue)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        if (phoneValue.length > 30) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be 30 characters or fewer"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }

        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE LOWER(email) = ?",
            [emailValue]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create the user and their profile atomically
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO users
                (first_name, last_name, email, phone, password, role)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    firstName,
                    lastName,
                    emailValue,
                    phoneValue,
                    hashedPassword,
                    role
                ]
            );

            const userId = result.insertId;

            if (role === "CUSTOMER") {
                await connection.query(
                    "INSERT INTO customer_profiles (user_id) VALUES (?)",
                    [userId]
                );
            }

            if (role === "PROVIDER") {
                await connection.query(
                    "INSERT INTO provider_profiles (user_id) VALUES (?)",
                    [userId]
                );
            }

            if (role === "BUSINESS_OWNER") {
                await connection.query(
                    "INSERT INTO businesses (owner_id, name) VALUES (?, ?)",
                    [userId, `${firstName}'s Business`]
                );
            }

            await connection.commit();

            // Account is created as UNVERIFIED. Generate a 6-digit PIN and
            // email it. The account cannot be used until email_verified is
            // set via /auth/verify-email. Registration does NOT log the user
            // in - they verify first, then sign in.
            const verificationPin = generateOtp();

            await db.query(
                `UPDATE users
                 SET verification_code_hash = ?,
                     verification_code_expires = ?,
                     verification_attempts = 0
                 WHERE id = ?`,
                [hashOtp(verificationPin), otpExpiry(), userId]
            );

            try {
                await sendEmailVerificationPin(
                    emailValue,
                    firstName,
                    verificationPin
                );
            } catch (error) {
                console.error(
                    "[auth] Failed to send verification PIN:",
                    error
                );
            }

            res.status(201).json({
                success: true,
                message: "Registration successful. A 6-digit verification PIN has been sent to your email.",
                verification: "sent",
                user: {
                    id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    email: emailValue,
                    phone: phoneValue,
                    role
                }
            });
        } catch (error) {
            await connection.rollback();

            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during registration"
        });
    }
};


// LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // 2. Find user
        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    password, role, email_verified, is_active,
                    two_factor_enabled
             FROM users
             WHERE LOWER(email) = ?`,
            [email.trim().toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // 3. Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });
        }

        // 4. Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 5. Email verification gate (when enabled).
        if (emailVerificationRequired() && !user.email_verified) {
            return res.status(403).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email address before logging in. Request a verification PIN and enter it on the email verification page."
            });
        }

        // 6. Two-factor step: correct password is only the first factor.
        // A fresh 6-digit code is emailed and the session is created only
        // after /auth/verify-2fa confirms it.
        if (user.two_factor_enabled) {
            const loginOtp = generateOtp();

            await db.query(
                `UPDATE users
                 SET login_otp_hash = ?,
                     login_otp_expires = ?,
                     login_otp_attempts = 0
                 WHERE id = ?`,
                [hashOtp(loginOtp), otpExpiry(), user.id]
            );

            try {
                await sendLoginOtp(user.email, user.first_name, loginOtp);
            } catch (error) {
                console.error("[auth] Failed to send login OTP:", error);
            }

            return res.status(200).json({
                success: false,
                code: "OTP_REQUIRED",
                message: "For your security, enter the 6-digit code that was sent to your email to finish signing in."
            });
        }

        // 7. Create JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // 8. Set the session token as an httpOnly cookie
        res.cookie("token", token, COOKIE_OPTIONS);

        // 9. Return user + token
        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                email_verified: user.email_verified
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};


// Build the session JWT, set the httpOnly cookie and respond with the
// authenticated user. Used after the password check (no 2FA) and after a
// verified login code.
const issueSession = (user, res) => {
    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    return res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            email_verified: user.email_verified
        }
    });
};


// VERIFY EMAIL WITH PIN  (public)
// POST /api/auth/verify-email  { email, pin }
const verifyEmail = async (req, res) => {
    try {
        const { email, pin } = req.body;

        const emailValue = (email || "").trim().toLowerCase();

        if (!emailValue || !pin) {
            return res.status(400).json({
                success: false,
                message: "Email and verification PIN are required"
            });
        }

        if (!isValidOtp(pin)) {
            return res.status(400).json({
                success: false,
                message: "Verification PIN must be 6 digits"
            });
        }

        const [rows] = await db.query(
            `SELECT id, email_verified,
                    verification_code_hash, verification_code_expires,
                    verification_attempts
             FROM users
             WHERE LOWER(email) = ?`,
            [emailValue]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification PIN"
            });
        }

        const user = rows[0];

        if (user.email_verified) {
            return res.json({
                success: true,
                message: "Your email is already verified. You can log in."
            });
        }

        if (
            !user.verification_code_hash ||
            !user.verification_code_expires ||
            new Date(user.verification_code_expires).getTime() < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "This verification PIN has expired. Please request a new one."
            });
        }

        if (!safeEqual(user.verification_code_hash, hashOtp(pin))) {
            const attempts = user.verification_attempts + 1;
            const lockedOut = attempts >= MAX_OTP_ATTEMPTS;

            await db.query(
                `UPDATE users
                 SET verification_attempts = ?,
                     verification_code_hash = CASE WHEN ? THEN NULL ELSE verification_code_hash END,
                     verification_code_expires = CASE WHEN ? THEN NULL ELSE verification_code_expires END
                 WHERE id = ?`,
                [attempts, lockedOut ? 1 : 0, lockedOut ? 1 : 0, user.id]
            );

            return res.status(400).json({
                success: false,
                message: lockedOut
                    ? "Too many incorrect attempts. Request a new verification PIN."
                    : "Incorrect verification PIN. Please try again."
            });
        }

        await db.query(
            `UPDATE users
             SET email_verified = TRUE,
                 verification_code_hash = NULL,
                 verification_code_expires = NULL,
                 verification_attempts = 0
             WHERE id = ?`,
            [user.id]
        );

        return res.json({
            success: true,
            message: "Email verified. You can now log in."
        });
    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while verifying email"
        });
    }
};


// RESEND VERIFICATION PIN  (public)
// POST /api/auth/resend-verification  { email }
const resendVerification = async (req, res) => {
    try {
        const emailValue = (req.body.email || "").trim().toLowerCase();

        if (!emailValue) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const waitVerificationMs = consumeOtpResendCooldown(emailValue);

        if (waitVerificationMs > 0) {
            return res.status(429).json({
                success: false,
                code: "RESEND_TOO_SOON",
                message: `Please wait about ${Math.ceil(waitVerificationMs / 1000)}s before requesting another PIN.`
            });
        }

        const [rows] = await db.query(
            `SELECT id, first_name, email_verified
             FROM users
             WHERE LOWER(email) = ?`,
            [emailValue]
        );

        // Never reveal whether an account exists.
        if (rows.length === 0 || rows[0].email_verified) {
            return res.json({
                success: true,
                message: "If that email exists, a new verification PIN has been sent."
            });
        }

        const user = rows[0];
        const verificationPin = generateOtp();

        await db.query(
            `UPDATE users
             SET verification_code_hash = ?,
                 verification_code_expires = ?,
                 verification_attempts = 0
             WHERE id = ?`,
            [hashOtp(verificationPin), otpExpiry(), user.id]
        );

        try {
            await sendEmailVerificationPin(user.email, user.first_name, verificationPin);
        } catch (error) {
            console.error("[auth] Failed to resend verification PIN:", error);
        }

        return res.json({
            success: true,
            message: "A new 6-digit verification PIN has been sent to your email."
        });
    } catch (error) {
        console.error("Resend verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while resending verification PIN"
        });
    }
};


// VERIFY LOGIN CODE (2FA)  (public, second factor)
// POST /api/auth/verify-2fa  { email, pin }
const verifyTwoFactor = async (req, res) => {
    try {
        const { email, pin } = req.body;

        const emailValue = (email || "").trim().toLowerCase();

        if (!emailValue || !pin) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required"
            });
        }

        if (!isValidOtp(pin)) {
            return res.status(400).json({
                success: false,
                message: "Verification code must be 6 digits"
            });
        }

        const [rows] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    role, email_verified, is_active,
                    two_factor_enabled,
                    login_otp_hash, login_otp_expires, login_otp_attempts
             FROM users
             WHERE LOWER(email) = ?`,
            [emailValue]
        );

        if (rows.length === 0 || !rows[0].is_active) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or verification code"
            });
        }

        const user = rows[0];

        if (!user.two_factor_enabled) {
            return res.status(400).json({
                success: false,
                message: "Two-factor authentication is not enabled for this account."
            });
        }

        if (
            !user.login_otp_hash ||
            !user.login_otp_expires ||
            new Date(user.login_otp_expires).getTime() < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                code: "OTP_EXPIRED",
                message: "This code has expired. Please sign in again to receive a new one."
            });
        }

        if (!safeEqual(user.login_otp_hash, hashOtp(pin))) {
            const attempts = user.login_otp_attempts + 1;
            const lockedOut = attempts >= MAX_OTP_ATTEMPTS;

            await db.query(
                `UPDATE users
                 SET login_otp_attempts = ?,
                     login_otp_hash = CASE WHEN ? THEN NULL ELSE login_otp_hash END,
                     login_otp_expires = CASE WHEN ? THEN NULL ELSE login_otp_expires END
                 WHERE id = ?`,
                [attempts, lockedOut ? 1 : 0, lockedOut ? 1 : 0, user.id]
            );

            return res.status(400).json({
                success: false,
                message: lockedOut
                    ? "Too many incorrect attempts. Please sign in again to receive a new code."
                    : "Incorrect verification code. Please try again."
            });
        }

        // Code confirmed: clear the OTP, mark the email verified (entering a
        // code sent to that address proves ownership) and create the session.
        await db.query(
            `UPDATE users
             SET login_otp_hash = NULL,
                 login_otp_expires = NULL,
                 login_otp_attempts = 0,
                 email_verified = TRUE
             WHERE id = ?`,
            [user.id]
        );

        return issueSession(user, res);
    } catch (error) {
        console.error("Two-factor verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while verifying code"
        });
    }
};


// RESEND LOGIN CODE (2FA)  (public)
// POST /api/auth/resend-otp  { email }
const resendOtp = async (req, res) => {
    try {
        const emailValue = (req.body.email || "").trim().toLowerCase();

        if (!emailValue) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const waitOtpMs = consumeOtpResendCooldown(emailValue);

        if (waitOtpMs > 0) {
            return res.status(429).json({
                success: false,
                code: "RESEND_TOO_SOON",
                message: `Please wait about ${Math.ceil(waitOtpMs / 1000)}s before requesting another code.`
            });
        }

        const [rows] = await db.query(
            `SELECT id, first_name, two_factor_enabled
             FROM users
             WHERE LOWER(email) = ? AND is_active = TRUE`,
            [emailValue]
        );

        // Generic response - never reveal whether the account exists or
        // whether 2FA is active.
        if (rows.length === 0 || !rows[0].two_factor_enabled) {
            return res.json({
                success: true,
                message: "If that account has two-factor authentication enabled, a new code has been sent."
            });
        }

        const user = rows[0];
        const loginOtp = generateOtp();

        await db.query(
            `UPDATE users
             SET login_otp_hash = ?,
                 login_otp_expires = ?,
                 login_otp_attempts = 0
             WHERE id = ?`,
            [hashOtp(loginOtp), otpExpiry(), user.id]
        );

        try {
            await sendLoginOtp(user.email, user.first_name, loginOtp);
        } catch (error) {
            console.error("[auth] Failed to resend login code:", error);
        }

        return res.json({
            success: true,
            message: "A new login code has been sent to your email."
        });
    } catch (error) {
        console.error("Resend login code error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while resending login code"
        });
    }
};


// SOFT SESSION CHECK
// Same as /me but never 401s: returns { success:false, user:null } for
// guests instead of an error status, so the client's global 401
// interceptor does not bounce public pages to /login.
const session = async (req, res) => {
    try {
        let token = null;

        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            const authHeader = req.headers.authorization;

            if (authHeader) {
                const parts = authHeader.split(" ");

                if (parts.length === 2 && parts[0] === "Bearer") {
                    token = parts[1];
                }
            }
        }

        if (!token) {
            return res.json({ success: false, user: null });
        }

        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            res.clearCookie("token", COOKIE_OPTIONS);

            return res.json({ success: false, user: null });
        }

        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    role, email_verified, is_active
             FROM users
             WHERE id = ?`,
            [decoded.id]
        );

        if (users.length === 0 || !users[0].is_active) {
            res.clearCookie("token", COOKIE_OPTIONS);

            return res.json({ success: false, user: null });
        }

        res.json({ success: true, user: users[0] });
    } catch (error) {
        console.error("Error checking session:", error);

        res.status(500).json({
            success: false,
            message: "Server error while checking session"
        });
    }
};


// GET CURRENT USER
// Requires protect middleware
const me = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    role, email_verified, is_active
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            res.clearCookie("token", COOKIE_OPTIONS);

            return res.status(401).json({
                success: false,
                message: "User no longer exists"
            });
        }

        const user = users[0];

        if (!user.is_active) {
            res.clearCookie("token", COOKIE_OPTIONS);

            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Error fetching current user:", error);

        res.status(500).json({
            success: false,
            message: "Server error while fetching user"
        });
    }
};


// PATCH /api/auth/profile  (authenticated user)
// Update personal details: first_name, last_name, phone,
// plus profile_image / location (customers) and description (providers).
const updateProfile = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            phone,
            profile_image,
            location
        } = req.body;

        const updates = {};
        const params = [];

        if (first_name !== undefined && first_name.trim()) {
            updates.first_name = first_name.trim();
        }
        if (last_name !== undefined && last_name.trim()) {
            updates.last_name = last_name.trim();
        }
        if (phone !== undefined && phone.trim()) {
            updates.phone = phone.trim();
        }

        if (Object.keys(updates).length === 0 && profile_image === undefined && location === undefined) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        if (updates.first_name && updates.first_name.length > 100 ||
            updates.last_name && updates.last_name.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Names must be 100 characters or fewer"
            });
        }

        if (updates.phone && updates.phone.length > 30) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be 30 characters or fewer"
            });
        }

        if (Object.keys(updates).length > 0) {
            // Allowlist of updatable columns — never interpolate user keys.
            const ALLOWED_COLUMNS = new Set(["first_name", "last_name", "phone"]);
            const setClauses = [];

            for (const key of Object.keys(updates)) {
                if (!ALLOWED_COLUMNS.has(key)) {
                    continue;
                }

                setClauses.push(`${key} = ?`);
                params.push(updates[key]);
            }

            params.push(req.user.id);

            if (setClauses.length > 0) {
                await db.query(
                    `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
                    params
                );
            }
        }

        if (req.user.role === "CUSTOMER" &&
            (profile_image !== undefined || location !== undefined)) {
            await db.query(
                `UPDATE customer_profiles
                 SET profile_image = COALESCE(?, profile_image),
                     location = COALESCE(?, location)
                 WHERE user_id = ?`,
                [profile_image?.trim() || null, location?.trim() || null, req.user.id]
            );
        }

        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    role, email_verified, is_active
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully",
            user: users[0]
        });
    } catch (error) {
        console.error("Profile update error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating profile"
        });
    }
};


// LOGOUT
const logout = (req, res) => {
    res.clearCookie("token", COOKIE_OPTIONS);

    res.json({
        success: true,
        message: "Logged out successfully"
    });
};


// CHANGE PASSWORD  (authenticated user)
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: "Current and new password are required"
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        if (current_password === new_password) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from the current one"
            });
        }

        const [users] = await db.query(
            "SELECT id, password FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(
            current_password,
            users[0].password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

        await db.query("UPDATE users SET password = ? WHERE id = ?", [
            hashedPassword,
            req.user.id
        ]);

        return res.json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while changing password"
        });
    }
};


// REQUEST PASSWORD RESET  (public)
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND is_active = TRUE",
            [normalizedEmail]
        );

        // Never reveal whether the account exists.
        if (users.length === 0) {
            return res.json({
                success: true,
                message: "If that email exists, a reset link has been sent."
            });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        await db.query("DELETE FROM password_reset_tokens WHERE user_id = ?", [
            users[0].id
        ]);

        await db.query(
            `INSERT INTO password_reset_tokens
                (user_id, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
            [users[0].id, tokenHash]
        );

        await sendPasswordResetEmail(users[0].email, token);

        return res.json({
            success: true,
            message: "If that email exists, a reset link has been sent."
        });
    } catch (error) {
        console.error("Password reset request error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while requesting password reset"
        });
    }
};


// RESET PASSWORD  (public, with token)
const resetPassword = async (req, res) => {
    try {
        const { token, email, new_password } = req.body;

        if (!token || !email || !new_password) {
            return res.status(400).json({
                success: false,
                message: "Token, email and new password are required"
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const [rows] = await db.query(
            `SELECT prt.id AS token_id, u.id AS user_id, u.email
             FROM password_reset_tokens prt
             JOIN users u ON u.id = prt.user_id
             WHERE prt.token_hash = ?
               AND prt.used = FALSE
               AND prt.expires_at > NOW()`,
            [tokenHash]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        if (rows[0].email !== email.trim().toLowerCase()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, BCRYPT_ROUNDS);

        await db.query("UPDATE users SET password = ? WHERE id = ?", [
            hashedPassword,
            rows[0].user_id
        ]);

        await db.query(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
            [rows[0].token_id]
        );

        return res.json({
            success: true,
            message: "Password reset successfully. You can now log in."
        });
    } catch (error) {
        console.error("Password reset error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while resetting password"
        });
    }
};


module.exports = {
    register,
    login,
    verifyEmail,
    resendVerification,
    verifyTwoFactor,
    resendOtp,
    me,
    session,
    updateProfile,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword
};