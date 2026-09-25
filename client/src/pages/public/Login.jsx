import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    resendOtp,
    resendVerification,
    verifyTwoFactor
} from "../../services/authService";
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

const PIN_PATTERN = /^\d{6}$/;

function Login() {
    const navigate = useNavigate();
    const { user, loading, login, setUser } = useAuth();

    const [step, setStep] = useState("credentials"); // credentials | otp
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [pin, setPin] = useState("");
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
            } else if (data.code === "OTP_REQUIRED") {
                // Correct password. Second factor required.
                setStep("otp");
                setPin("");
            } else {
                setError(data.message || "Login failed. Please try again.");
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

    const handleOtpSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setResendMessage("");

        if (!PIN_PATTERN.test(pin)) {
            setError("Your login code is 6 digits.");

            return;
        }

        setLoggingIn(true);

        try {
            const data = await verifyTwoFactor(formData.email.trim(), pin);

            if (data.success) {
                setUser(data.user);
                navigate(ROLE_PATHS[data.user.role] || "/");
            } else {
                setError(data.message || "That code could not be verified.");
            }
        } catch (error) {
            const serverError = error.response?.data;

            setError(
                serverError?.message ||
                "That code could not be verified. Try again."
            );
        } finally {
            setLoggingIn(false);
        }
    };

    // Resend the login 2FA code.
    const handleResendOtp = async () => {
        setResendMessage("");

        if (!formData.email.trim()) {
            return;
        }

        try {
            const data = await resendOtp(formData.email.trim());

            setResendMessage(
                data?.success
                    ? data.message || "A new login code has been sent."
                    : data?.message || "Could not resend the code. Try again later."
            );
        } catch (error) {
            setResendMessage(
                error.response?.data?.message ||
                "Could not resend the code. Try again later."
            );
        }
    };

    // Resend the registration verification PIN (unverified account).
    const handleResendVerification = async () => {
        setResendMessage("");

        if (!verifyPendingEmail) {
            return;
        }

        try {
            const data = await resendVerification(verifyPendingEmail);

            setResendMessage(
                data?.success
                    ? data.message || "A new verification PIN has been sent."
                    : data?.message || "Could not resend the PIN. Try again later."
            );
        } catch (error) {
            setResendMessage(
                error.response?.data?.message ||
                "Could not resend the PIN. Try again later."
            );
        }
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
                    {step === "otp" ? "Check your email" : "Welcome back"}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    {step === "otp"
                        ? `We emailed a 6-digit code to ${formData.email.trim()}. Enter it below to finish signing in.`
                        : "Log in to QuickFix to continue to your dashboard."}
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {step === "otp" ? (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <Input
                                label="6-digit login code"
                                id="pin"
                                name="pin"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) =>
                                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                hint="Sent to your email. Expires in 10 minutes."
                                maxLength="6"
                                required
                            />

                            <Button
                                type="submit"
                                loading={loggingIn}
                                className="w-full"
                            >
                                {loggingIn ? "Verifying…" : "Verify code & log in"}
                            </Button>

                            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-center">
                                <p className="text-sm text-indigo-700">
                                    Didn't get a code? Check your spam folder,
                                    or send a new one.
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="mt-2"
                                    onClick={handleResendOtp}
                                    disabled={loggingIn}
                                >
                                    Resend login code
                                </Button>
                            </div>

                            {resendMessage && (
                                <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                    {resendMessage}
                                </p>
                            )}

                            <button
                                type="button"
                                className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-700"
                                onClick={() => setStep("credentials")}
                            >
                                ← Use a different email or password
                            </button>
                        </form>
                    ) : (
                        <>
                            {verifyPendingEmail && (
                                <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                                    <p className="text-sm text-indigo-800">
                                        This account isn't verified yet. Use
                                        the 6-digit PIN we emailed you
                                        (check spam too) on the verification
                                        page, then log in again.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleResendVerification}
                                        >
                                            Send new verification PIN
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                navigate(`/verify-email?email=${encodeURIComponent(verifyPendingEmail)}`)
                                            }
                                        >
                                            Open verification page
                                        </Button>
                                    </div>
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
                                    {loggingIn ? "Checking…" : "Log in"}
                                </Button>
                            </form>
                        </>
                    )}

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