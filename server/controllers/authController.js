const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_MAX_AGE = 60 * 60 * 24; // 1 day in seconds

const BCRYPT_ROUNDS = 10;

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

            res.status(201).json({
                success: true,
                message: "Registration successful",
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
                    password, role, email_verified, is_active
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
    me,
    session,
    updateProfile,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword
};