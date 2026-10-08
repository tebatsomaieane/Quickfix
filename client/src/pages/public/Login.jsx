import { useState } from "react";
import { useSearchParams, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resendOtp, verifyTwoFactor } from "../../services/authService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
import useFormValidation from "../../hooks/useFormValidation";
import { rules } from "../../lib/validation";
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

const INITIAL_CREDENTIALS = { email: "", password: "" };

/**
 * Login validates format only. The password rule is deliberately absent: the
 * account's real requirements belong to whoever set it, and rejecting a
 * shorter-but-valid password here would lock a legitimate user out of their
 * own account. Strength is enforced at registration instead.
 */
const CREDENTIAL_SCHEMA = {
    email: [rules.required("Email address"), rules.email()],
    password: [rules.required("Password")]
};

function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, loading, login, setUser } = useAuth();

    // The API bounces a request made with an expired token here with
    // `?expired=1`. Without reading it, a user whose session died mid-task
    // lands on a bare login form with no idea why they were signed out.
    const sessionExpired = searchParams.get("expired") === "1";

    const [step, setStep] = useState("credentials"); // credentials | otp
    const {
        values: formData,
        errors,
        formError,
        announcement,
        handleChange,
        handleBlur,
        validateAll,
        applyServerError
    } = useFormValidation({
        schema: CREDENTIAL_SCHEMA,
        initialValues: INITIAL_CREDENTIALS
    });
    const [pin, setPin] = useState("");
    const [pinError, setPinError] = useState("");
    const [error, setError] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    if (!loading && user) {
        const target = ROLE_PATHS[user.role] || "/";

        return <Navigate to={target} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setResendMessage("");

        if (!validateAll(formData)) {
            return;
        }

        setLoggingIn(true);

        try {
            const data = await login({
                email: formData.email.trim(),
                password: formData.password
            });

            if (data.success) {
                navigate(ROLE_PATHS[data.user.role] || "/");
            } else if (data.code === "OTP_REQUIRED") {
                // Correct password. Second factor required.
                setStep("otp");
                setPin("");
                setPinError("");
            } else {
                setError(data.message || "Login failed. Please try again.");
            }
        } catch (requestError) {
            const serverError = requestError.response?.data;

            // Delivery being down says nothing about the address the user
            // typed, so it is never blamed on the email field. Checked first
            // because the message does mention email, which would otherwise
            // light up an input the user got exactly right.
            if (serverError?.code === "EMAIL_DELIVERY_UNAVAILABLE") {
                setError(
                    serverError.message ||
                        "We could not email you a login code. Please try again in a few minutes."
                );
            } else if (serverError?.message?.toLowerCase().includes("email")) {
                // A rejected address is worth flagging on the field itself; a
                // rejected password stays a banner so we do not imply the user
                // mistyped something they cannot see.
                applyServerError(requestError);
            } else {
                setError(
                    serverError?.message || "Login failed. Please try again."
                );
            }
        } finally {
            setLoggingIn(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setResendMessage("");
        setPinError("");

        if (!PIN_PATTERN.test(pin)) {
            setPinError("Your login code is 6 digits.");

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
                    {(error || formError) && (
                        <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error || formError}
                        </div>
                    )}

                    {step === "otp" ? (
                        <form onSubmit={handleOtpSubmit} noValidate className="space-y-4">
                            <Input
                                label="6-digit login code"
                                id="pin"
                                name="pin"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) => {
                                    setPin(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    );
                                    setPinError("");
                                }}
                                error={pinError}
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
                                <p role="status" className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
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
                            {sessionExpired && step === "credentials" && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                                    <p className="text-sm font-medium text-amber-800">
                                        Your session expired.
                                    </p>
                                    <p className="mt-1 text-xs text-amber-700">
                                        For your security you were signed out.
                                        Log in again to continue.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <Input
                                    label="Email"
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="example@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="email"
                                    autoCapitalize="none"
                                    spellCheck="false"
                                    error={errors.email}
                                    required
                                />

                                <PasswordInput
                                    label="Password"
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="current-password"
                                    error={errors.password}
                                    required
                                />

                                <Button
                                    type="submit"
                                    loading={loggingIn}
                                    className="w-full"
                                >
                                    {loggingIn ? "Checking…" : "Log in"}
                                </Button>

                                <p aria-live="polite" className="sr-only">
                                    {announcement}
                                </p>
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