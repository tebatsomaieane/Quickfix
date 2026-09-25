import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerification, verifyEmail } from "../../services/authService";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import verifyImage from "../../assets/cleaner.jpg";

const PIN_PATTERN = /^\d{6}$/;

function VerifyEmail() {
    const [params] = useSearchParams();
    const [email, setEmail] = useState(params.get("email") || "");
    const [pin, setPin] = useState("");
    const [status, setStatus] = useState("idle"); // idle | success | error
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setStatus("checking");

        if (!email.trim()) {
            setStatus("error");
            setMessage("Enter the email address you registered with.");

            return;
        }

        if (!PIN_PATTERN.test(pin)) {
            setStatus("error");
            setMessage("Your verification PIN is 6 digits.");

            return;
        }

        setLoading(true);

        try {
            const data = await verifyEmail(email.trim(), pin);

            setStatus(data.success ? "success" : "error");
            setMessage(data.message || "Unable to verify your email.");
        } catch (error) {
            setStatus("error");
            setMessage(
                error.response?.data?.message ||
                "Unable to verify your email. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setResendMessage("Enter your email address to resend the PIN.");

            return;
        }

        setResendLoading(true);
        setResendMessage("");

        try {
            const data = await resendVerification(email.trim());

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
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthShell
            image={verifyImage}
            imageSeed="Verified provider ready to help in Lesotho"
            imageIcon="mail"
            eyebrow="Verified & ready to help."
            highlights={["Your account is nearly ready to use"]}
        >
            <div>
                <Logo size="lg" brand="Quick" accent="Fix" />
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    {status === "success" ? "Email verified" : "Verify your email"}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    {status === "success"
                        ? "Your QuickFix account is now active."
                        : "Enter the 6-digit PIN we emailed you (check spam too). It expires in 10 minutes."}
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {message && (
                        <div
                            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                                status === "success"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    {status === "success" ? (
                        <>
                            <div className="flex items-center gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg font-bold text-emerald-600">
                                    ✓
                                </span>
                                <p className="text-sm text-slate-600">
                                    You can now sign in with your email and
                                    password. If two-factor authentication is
                                    on, you'll enter one more code at login.
                                </p>
                            </div>
                            <Button
                                className="mt-6 w-full"
                                onClick={() =>
                                    (window.location.href = "/login")
                                }
                            >
                                Continue to login
                            </Button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email address"
                                type="email"
                                name="email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />

                            <Input
                                label="6-digit verification PIN"
                                id="pin"
                                name="pin"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) =>
                                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                                }
                                hint="Sent to your email at registration."
                                maxLength="6"
                                required
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                loading={loading}
                            >
                                {loading ? "Verifying…" : "Verify email"}
                            </Button>

                            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-center">
                                <p className="text-sm text-indigo-700">
                                    Didn't get a PIN? Try your spam folder, or
                                    resend it.
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="mt-2"
                                    onClick={handleResend}
                                    loading={resendLoading}
                                >
                                    Resend verification PIN
                                </Button>
                                {resendMessage && (
                                    <p className="mt-2 text-sm text-indigo-700">
                                        {resendMessage}
                                    </p>
                                )}
                            </div>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-600">
                        <Link
                            to="/login"
                            className="font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
        </AuthShell>
    );
}

export default VerifyEmail;