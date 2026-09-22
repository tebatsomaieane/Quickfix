const jwt = require("jsonwebtoken");


// Protect route
const protect = (req, res, next) => {
    try {
        let token = null;

        // 1. Prefer the httpOnly cookie
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        // 2. Fall back to the Authorization header
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
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};


// Role authorization
const authorize = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission."
            });
        }

        next();
    };
};


module.exports = {
    protect,
    authorize
};