import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resendVerification } from "../../services/authService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
import loginHeroImage from "../../assets/electrician.jpg";

const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

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
    const [verifyPendingEmail, setVerifyPendingEmail] = useState("");
    const [resendMessage, setResendMessage] = useState("");

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setResendMessage("");
        setLoggingIn(true);

        try {
            const data = await login(formData);

            if (data.success) {
                navigate(ROLE_PATHS[data.user.role] || "/");
            }
        } catch (error) {
            const serverError = error.response?.data;

            setError(
                serverError?.message || "Login failed. Please try again."
            );

            if (serverError?.code === "EMAIL_NOT_VERIFIED") {
                setVerifyPendingEmail(formData.email.trim());
            }
        } finally {
            setLoggingIn(false);
        }
    };

    const handleResend = async () => {
        setResendMessage("");

        if (!verifyPendingEmail) {
            return;
        }

        const data = await resendVerification(verifyPendingEmail);

        setResendMessage(
            data?.success
                ? data.message || "A new verification link has been sent."
                : data?.message || "Could not resend the link. Try again later."
        );
    };

    return (
        <AuthShell
            image={loginHeroImage}
            imageSeed="Verified electrician at work in Lesotho"
            imageIcon="wrench"
            eyebrow="Verified professionals, close to home."
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

                    {verifyPendingEmail && (
                        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                            <p className="text-sm text-indigo-800">
                                Verify your email, then log in with the same
                                link from your inbox (check spam too).
                            </p>
                            <Button
                                className="mt-3"
                                onClick={handleResend}
                            >
                                Resend verification email
                            </Button>
                            {resendMessage && (
                                <p className="mt-2 text-sm text-indigo-700">
                                    {resendMessage}
                                </p>
                            )}
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