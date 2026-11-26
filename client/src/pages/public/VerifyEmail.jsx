import { useState } from "react";
import {
    Link,
    Navigate,
    useLocation,
    useNavigate,
    useSearchParams
} from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resendVerification, verifyEmail } from "../../services/authService";
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
    "One quick code confirms it's really you",
    "Keeps your account and requests safe",
    "Takes less than a minute"
];

const PIN_PATTERN = /^\d{6}$/;

function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, loading, setUser } = useAuth();

    const seededEmail =
        searchParams.get("email") ||
        location.state?.email ||
        "";

    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const [pinError, setPinError] = useState("");
    const [status, setStatus] = useState("");
    const [restart, setRestart] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    if (!loading && user) {
        const target = ROLE_PATHS[user.role] || "/";

        return <Navigate to={target} replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setStatus("");
        setPinError("");
        setRestart(false);

        if (!seededEmail) {
            setError("Your verification email is missing. Please start registration again.");
            setRestart(true);

            return;
        }

        if (!PIN_PATTERN.test(pin)) {
            setPinError("Your verification code is 6 digits.");

            return;
        }

        setVerifying(true);

        try {
            const data = await verifyEmail(seededEmail, pin);

            if (data.success) {
                setUser(data.user);
                navigate(ROLE_PATHS[data.user.role] || "/");

                return;
            }

            setError(data.message || "That code could not be verified.");
        } catch (requestError) {
            const serverError = requestError.response?.data;
            const code = serverError?.code;

            if (
                code === "REGISTRATION_EXPIRED" ||
                code === "REGISTRATION_NOT_FOUND" ||
                code === "REGISTRATION_REJECTED"
            ) {
                setRestart(true);
            }

            setError(
                serverError?.message ||
                    "That code could not be verified. Try again."
            );
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setStatus("");
        setRestart(false);

        if (!seededEmail) {
            setError("Your verification email is missing. Please start registration again.");
            setRestart(true);

            return;
        }

        setResending(true);

        try {
            const data = await resendVerification(seededEmail);

            setStatus(
                data?.success
                    ? data.message || "A new verification code has been sent."
                    : data?.message || "Could not resend the code. Try again later."
            );
        } catch (requestError) {
            const serverError = requestError.response?.data;
            const code = serverError?.code;

            if (code === "REGISTRATION_NOT_FOUND") {
                setRestart(true);
            }

            if (
                code === "EMAIL_DELIVERY_FAILED" ||
                code === "EMAIL_DELIVERY_UNAVAILABLE"
            ) {
                setError(
                    serverError?.message ||
                        "Could not deliver a new code. Try again later."
                );

                return;
            }

            setStatus(
                serverError?.message ||
                    "Could not resend the code. Try again later."
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthShell
            image={loginHeroImage}
            imageSeed="Verified professional at work in Lesotho"
            imageIcon="checkBadge"
            eyebrow="Confirm your email and you're in."
            highlights={HIGHLIGHTS}
        >
            <div>
                <Logo size="lg" brand="Quick" accent="Fix" />
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    Verify your email
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Enter the single 6-digit code we emailed you to finish creating your account.
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {error && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            <p>{error}</p>
                            {restart && (
                                <Link
                                    to="/register"
                                    className="mt-1 inline-block font-semibold underline"
                                >
                                    Start registration again
                                </Link>
                            )}
                        </div>
                    )}

                    {seededEmail && (
                        <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Verification code sent to
                            </p>
                            <p className="mt-1 break-all text-sm font-medium text-slate-800">
                                {seededEmail}
                            </p>
                            <Link
                                to="/register"
                                className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Use a different email
                            </Link>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <Input
                            label="6-digit verification code"
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
                            loading={verifying}
                            className="w-full"
                        >
                            {verifying ? "Verifying…" : "Verify email"}
                        </Button>
                    </form>

                    <div className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-center">
                        <p className="text-sm text-indigo-700">
                            Didn't get a code? Check your spam folder, or send a
                            new one.
                        </p>
                        <Button
                            type="button"
                            variant="ghost"
                            className="mt-2"
                            onClick={handleResend}
                            disabled={resending || verifying || !seededEmail}
                        >
                            {resending ? "Sending…" : "Resend code"}
                        </Button>
                    </div>

                    {status && (
                        <p
                            role="status"
                            className="mt-4 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700"
                        >
                            {status}
                        </p>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Already verified?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </AuthShell>
    );
}

export default VerifyEmail;
