import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/ui/Spinner";

// Role-specific dashboard paths
const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Waiting for the session cookie to be verified
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Spinner />
            </div>
        );
    }

    // Not authenticated -> send to login
    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    // Role mismatch -> send user to their own dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <Navigate
                to={ROLE_PATHS[user.role] || "/login"}
                replace
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;