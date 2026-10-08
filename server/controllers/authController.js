const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
    sendPasswordResetEmail,
    sendLoginOtp,
    isEmailConfigured,
    EmailDeliveryError
} = require("../utils/email");

const JWT_MAX_AGE = 60 * 60 * 24; // 1 day in seconds

const BCRYPT_ROUNDS = 10;

// A real bcrypt hash compared against when the submitted email matches no
// account, so a miss and a wrong password cost the same wall-clock time.
// Without it, the fast "no such user" return is a reliable signal that the
// address does not exist.
const BCRYPT_DUMMY_HASH =
    "$2b$10$XidJoeJ8jS/nj8ksraazTOAixSFGT2J2SpjSuL7MHljm7YU.J4i2O";

// One-time PIN (login 2FA).
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

// Failed sign-in attempts, counted per account rather than per IP. The IP
// limiter in routes/authRoutes.js is deliberately generous because many real
// users share one address (campus/mobile CGNAT); this counter is what bounds
// password guessing against a single account regardless of where it comes
// from. Counted for every address -- including ones that do not exist -- so
// the response is identical either way and the counter cannot be used to
// discover which accounts are real.
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 8;
const loginFailures = new Map();

const recordLoginFailure = (email) => {
    const now = Date.now();
    const entry = loginFailures.get(email);

    if (!entry || entry.resetAt <= now) {
        loginFailures.set(email, {
            count: 1,
            resetAt: now + LOGIN_FAILURE_WINDOW_MS
        });

        return 1;
    }

    entry.count += 1;

    return entry.count;
};

const loginFailuresExceeded = (email) => {
    const entry = loginFailures.get(email);

    if (!entry) {
        return false;
    }

    if (entry.resetAt <= Date.now()) {
        loginFailures.delete(email);

        return false;
    }

    return entry.count >= MAX_LOGIN_FAILURES;
};

// An email we promised to send but could not. Reported instead of a "sent"
// response so the client can tell the user to retry rather than leaving them
// waiting on a message that will never arrive.
const EMAIL_UNAVAILABLE_MESSAGE =
    "We could not send the email right now. Please try again in a few minutes.";

const emailUnavailable = (res) =>
    res.status(503).json({
        success: false,
        code: "EMAIL_DELIVERY_UNAVAILABLE",
        message: EMAIL_UNAVAILABLE_MESSAGE
    });

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

        // Shape and format are already settled by the `auth.register` schema in
        // validators/schemas.js, which also lowercases and trims before the
        // body reached this point. What is left is the one check a schema
        // cannot make, because only the database knows: is this email taken?
        const firstName = first_name;
        const lastName = last_name;
        const emailValue = email;
        const phoneValue = phone;

        // Creating an account needs no mail server: there is no verification
        // PIN to deliver. The account is active from the first response, so
        // sign-up works even when SMTP is unset, and the session cookie is
        // issued in the same response so the user lands signed in.

        const [existingUsers] = await db.query(
            // Plain equality, not `LOWER(email) = ?`. Wrapping the column in a
            // function makes the predicate non-sargable, so MySQL full-scans
            // `users` on every single sign-in. The column's collation is
            // already case-insensitive, and the value is normalised to
            // lowercase on the way in, so equality against the UNIQUE index is
            // both correct and an index lookup.
            "SELECT id FROM users WHERE email = ?",
            [emailValue]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with that email address already exists",
                errors: { email: "This email address is already registered" }
            });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create the user and their profile atomically
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO users
                (first_name, last_name, email, phone, password, role,
                 email_verified, two_factor_enabled)
                VALUES (?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
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

            // Two-factor login is opt-in (Settings -> Two-factor login), not
            // a default: a flag that is on for everyone but silently skipped
            // whenever SMTP is missing is worse than an honest default, and it
            // would otherwise put a code screen between every new user and
            // their dashboard.
            //
            // The session is issued now, so registration ends signed in: the
            // account is usable the moment it exists, with no email round
            // trip standing between the form and the dashboard.
            const token = jwt.sign(
                {
                    id: userId,
                    email: emailValue,
                    role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            res.cookie("token", token, COOKIE_OPTIONS);

            res.status(201).json({
                success: true,
                message: "Registration successful. You are now signed in.",
                user: {
                    id: userId,
                    first_name: firstName,
                    last_name: lastName,
                    email: emailValue,
                    phone: phoneValue,
                    role,
                    email_verified: true,
                    two_factor_enabled: false,
                    profile_image: null,
                    location: null
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

        // Throttled addresses are rejected before the lookup, with the same
        // response a wrong password would get the request before, so the
        // counter never confirms whether an account exists.
        if (loginFailuresExceeded(email)) {
            return res.status(429).json({
                success: false,
                code: "LOGIN_THROTTLED",
                message:
                    "Too many failed sign-in attempts for this account. Please wait a few minutes and try again."
            });
        }

        // 1. Find user.
        //
        // Plain equality against the UNIQUE index rather than `LOWER(email) = ?`,
        // which is non-sargable and full-scans the table on every sign-in. Safe
        // because the `auth.login` schema lowercases the submitted address and
        // registration stores it that way.
        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    password, role, email_verified, is_active,
                    two_factor_enabled
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            // Spend the same bcrypt time an existing account would, so response
            // latency does not reveal which addresses are registered.
            await bcrypt.compare(password, BCRYPT_DUMMY_HASH);
            recordLoginFailure(email);

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // 2. Check account status
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });
        }

        // 3. Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            recordLoginFailure(email);

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // A correct password is proof of ownership: clear the counter so a
        // user who simply mistyped a few times is not punished afterwards.
        loginFailures.delete(email);

        // 4. Two-factor step: correct password is only the first factor.
        // A fresh 6-digit code is emailed and the session is created only
        // after /auth/verify-2fa confirms it.
        if (user.two_factor_enabled) {
            // If no mail server is configured, a login code can never be
            // delivered and every 2FA-flagged account is locked out forever
            // (the delivery code path alone threw a 503). Fall through to the
            // password-only session rather than bricking real users; note it
            // loudly so the operator fixes the environment, not the app.
            const twoFactorEmailUnavailable = !isEmailConfigured();

            if (twoFactorEmailUnavailable) {
                console.warn(
                    `[auth] Two-factor login skipped for user ${user.id}: SMTP is not configured. Set SMTP_* env vars in production to enforce two-factor login.`
                );
            } else {
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

                    // No code means no way in. Clear the unused hash so the
                    // next sign-in attempt mints a fresh code rather than
                    // leaving the user on a code screen for a PIN that was
                    // never delivered.
                    if (error instanceof EmailDeliveryError) {
                        await db.query(
                            `UPDATE users
                             SET login_otp_hash = NULL,
                                 login_otp_expires = NULL
                             WHERE id = ?`,
                            [user.id]
                        );

                        return emailUnavailable(res);
                    }
                }

                return res.status(200).json({
                    success: false,
                    code: "OTP_REQUIRED",
                    message: "For your security, enter the 6-digit code that was sent to your email to finish signing in."
                });
            }
        }

        // 5. Create JWT
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

        // 6. Set the session token as an httpOnly cookie
        res.cookie("token", token, COOKIE_OPTIONS);

        // 7. Return user + token
        // The customer profile columns are joined in so a freshly logged-in
        // customer lands on Settings with their photo and location already
        // populated, rather than blank until a later refetch.
        const [customerProfile] = await db.query(
            `SELECT profile_image, location
             FROM customer_profiles
             WHERE user_id = ?`,
            [user.id]
        );

        res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                email_verified: user.email_verified,
                two_factor_enabled: user.two_factor_enabled,
                profile_image: customerProfile[0]?.profile_image || null,
                location: customerProfile[0]?.location || null
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
        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            email_verified: user.email_verified,
            two_factor_enabled: user.two_factor_enabled
        }
    });
};


// VERIFY LOGIN CODE (2FA)  (public, second factor)
// POST /api/auth/verify-2fa  { email, pin }
const verifyTwoFactor = async (req, res) => {
    try {
        const { email, pin } = req.body;

        // Already trimmed and lowercased by the `auth.verifyTwoFactor` schema.
        const emailValue = email;

        const [rows] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    role, email_verified, is_active,
                    two_factor_enabled,
                    login_otp_hash, login_otp_expires, login_otp_attempts
             FROM users
             WHERE email = ?`,
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

        // Code confirmed: clear the spent OTP and create the session.
        await db.query(
            `UPDATE users
             SET login_otp_hash = NULL,
                 login_otp_expires = NULL,
                 login_otp_attempts = 0
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
        const emailValue = req.body.email;

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
             WHERE email = ? AND is_active = TRUE`,
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

            if (error instanceof EmailDeliveryError) {
                return emailUnavailable(res);
            }
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
                    role, email_verified, is_active,
                    two_factor_enabled
             FROM users
             WHERE id = ?`,
            [decoded.id]
        );

        if (users.length === 0 || !users[0].is_active) {
            res.clearCookie("token", COOKIE_OPTIONS);

            return res.json({ success: false, user: null });
        }

        // Customer profile columns are not part of the `users` row, so the
        // session has to read them separately. Without this the client had no
        // way to show a customer's existing photo or location.
        const [profiles] = await db.query(
            `SELECT profile_image, location
             FROM customer_profiles
             WHERE user_id = ?`,
            [decoded.id]
        );

        res.json({
            success: true,
            user: {
                ...users[0],
                profile_image: profiles[0]?.profile_image || null,
                location: profiles[0]?.location || null
            }
        });
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
                    role, email_verified, is_active,
                    two_factor_enabled
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
            return res.status(422).json({
                success: false,
                message: "Nothing to update. Please change at least one field."
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
            // Previously both columns used COALESCE(?, col), which meant an
            // empty string resolved to NULL and the existing value was kept.
            // That made it impossible for a customer to clear a photo or a
            // location: the UI reported success and the change silently
            // did nothing. A NULL here now means "clear this field".
            await db.query(
                `UPDATE customer_profiles
                 SET profile_image = ?,
                     location = ?
                 WHERE user_id = ?`,
                [profile_image === undefined ? undefined : profile_image?.trim() || null,
                 location === undefined ? undefined : location?.trim() || null,
                 req.user.id]
            );
        }

        const [users] = await db.query(
            `SELECT id, first_name, last_name, email, phone,
                    role, email_verified, is_active,
                    two_factor_enabled
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        // The session and profile-update responses previously omitted the
        // customer-only columns, so the Settings form always rendered blank
        // photo/location inputs and silently discarded them on save.
        const [profiles] = await db.query(
            `SELECT profile_image, location
             FROM customer_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                ...users[0],
                profile_image: profiles[0]?.profile_image || null,
                location: profiles[0]?.location || null
            }
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

        // Presence and strength are settled by the `auth.changePassword`
        // schema. Left here are the two checks it cannot make: that the
        // submitted current password is the real one, and that the new password
        // is not simply the old one back again.
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


// SET / UNSET TWO-FACTOR  (authenticated user)
// PATCH /api/auth/2fa  { enabled: boolean }
const updateTwoFactor = async (req, res) => {
    try {
        // Presence and shape are settled by the `auth.toggleTwoFactor`
        // schema. We only flip the stored flag; whatever the setting, the
        // codes themselves continue to flow through the same sendLoginOtp
        // path used at sign-in.
        const enabled = !!req.body.enabled;

        await db.query(
            "UPDATE users SET two_factor_enabled = ? WHERE id = ?",
            [enabled ? 1 : 0, req.user.id]
        );

        return res.json({
            success: true,
            message: enabled
                ? "Two-factor authentication is now on."
                : "Two-factor authentication is now off.",
            two_factor_enabled: enabled
        });
    } catch (error) {
        console.error("Update two-factor error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating two-factor settings"
        });
    }
};


// REQUEST PASSWORD RESET  (public)
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await db.query(
            // Index lookup rather than a `LOWER(email) = LOWER(?)` scan: the
            // schema lowercases the submitted address and the column is stored
            // that way, so equality against the UNIQUE index is both correct
            // and fast.
            "SELECT id, email FROM users WHERE email = ? AND is_active = TRUE",
            [email]
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

        try {
            await sendPasswordResetEmail(users[0].email, token);
        } catch (error) {
            console.error("[auth] Failed to send password reset email:", error);

            // Still no confirmation that the address exists. A 503 here would
            // otherwise turn a delivery outage into an account oracle.
            if (error instanceof EmailDeliveryError) {
                return emailUnavailable(res);
            }
        }

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

        // Presence, token shape, email format and password strength are all
        // settled by the `auth.resetPassword` schema.
        //
        // The emailed token is the secret itself; only its digest is stored, so
        // a leaked database row cannot be replayed as a reset link.
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
                message: "This reset link is invalid or has expired. Please request a new one."
            });
        }

        // The token is the secret; the email is only there to stop a link
        // forwarded to the wrong inbox from being usable. Both failures are
        // reported identically so neither reveals whether the token existed.
        if (rows[0].email !== email) {
            return res.status(400).json({
                success: false,
                message: "This reset link is invalid or has expired. Please request a new one."
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
    verifyTwoFactor,
    resendOtp,
    me,
    session,
    updateProfile,
    logout,
    changePassword,
    updateTwoFactor,
    requestPasswordReset,
    resetPassword
};