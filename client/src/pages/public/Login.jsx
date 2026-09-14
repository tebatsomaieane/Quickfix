import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Icon from "../../components/ui/Icon";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
import { IMAGES } from "../../lib/visuals";

const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

const DEMO_ACCOUNTS = [
    {
        label: "Customer",
        icon: "user",
        email: "palesa.motaung@example.com",
        token: "customer"
    },
    {
        label: "Provider",
        icon: "wrench",
        email: "john.mokoena@example.com",
        token: "provider"
    },
    {
        label: "Admin",
        icon: "shield",
        email: "admin@quickfix.com",
        token: "admin"
    }
];

// Demo accounts are bundled in dev only. For a production build set
// VITE_SHOW_DEMO=true explicitly if you still want them available.
const SHOW_DEMO_ACCOUNTS =
    import.meta.env.VITE_SHOW_DEMO === "true" ||
    (import.meta.env.DEV && import.meta.env.VITE_SHOW_DEMO !== "false");

const HIGHLIGHTS = [
    "Compare offers from verified providers",
    "Track every request and job in one place",
    "Pay on results — rate your provider honestly"
];

function Login() {
    const navigate = useNavigate();
    const { user, loading, login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    if (!loading && user) {
        const target = ROLE_PATHS[user.role] || "/";

        return <Navigate to={target} replace />;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const fillDemo = (email) => {
        setError("");
        setFormData((previous) => ({ ...previous, email, password: "Password@123" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoggingIn(true);

        try {
            const data = await login(formData);

            if (data.success) {
                navigate(ROLE_PATHS[data.user.role] || "/");
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Login failed. Please try again."
            );
        } finally {
            setLoggingIn(false);
        }
    };

    return (
        <AuthShell
            image={IMAGES.heroEngineer}
            imageSeed="login engineer"
            imageIcon="wrench"
            highlights={HIGHLIGHTS}
        >
            <div>
                <Logo size="lg" brand="Quick" accent="Fix" />
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    Welcome back
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Log in to QuickFix to continue to your dashboard.
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />

                        <Input
                            label="Password"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />

                        <Button
                            type="submit"
                            loading={loggingIn}
                            className="w-full"
                        >
                            {loggingIn ? "Logging in..." : "Log in"}
                        </Button>
                    </form>

                    <div className="mt-6">
                        {SHOW_DEMO_ACCOUNTS && (<>
                            <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                                Try a demo account
                            </p>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                                {DEMO_ACCOUNTS.map((account) => (
                                    <button
                                        key={account.token}
                                        type="button"
                                        onClick={() => fillDemo(account.email)}
                                        className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                    >
                                        <Icon name={account.icon} className="h-4 w-4" />
                                        {account.label}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-center text-[11px] text-slate-400">
                                One click fills the credentials (password:{" "}
                                <code className="font-mono">Password@123</code>)
                            </p>
                        </>)}
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Sign up
                        </Link>
                    </p>
                    <p className="mt-3 text-center text-sm text-slate-600">
                        <Link
                            to="/forgot-password"
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Forgot your password?
                        </Link>
                    </p>
                </div>
            </div>
        </AuthShell>
    );
}

export default Login;