import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resendVerification, verifyEmail } from "../../services/authService";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import verifyImage from "../../assets/cleaner.jpg";

function VerifyEmail() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState("checking"); // checking | success | error | resent
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState(params.get("email") || "");
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    const invokedRef = useRef(false);

    useEffect(() => {
        if (invokedRef.current) {
            return;
        }

        const token = params.get("token");
        const emailParam = params.get("email");

        if (!token || !emailParam) {
            setStatus("error");
            setMessage("This link is incomplete. Use the link from your email.");

            return;
        }

        invokedRef.current = true;

        verifyEmail(emailParam, token)
            .then((data) => {
                if (data.success) {
                    setStatus("success");
                    setMessage(data.message);
                } else {
                    setStatus("error");
                    setMessage(data.message || "Unable to verify your email.");
                }
            })
            .catch((error) => {
                setStatus("error");
                setMessage(
                    error.response?.data?.message ||
                    "Unable to verify your email. Please try again."
                );
            });
    }, [params]);

    const handleResend = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setResendMessage("Enter your email address to resend the link.");

            return;
        }

        setResendLoading(true);
        setResendMessage("");

        const data = await resendVerification(email.trim());

        if (data.success) {
            setResendMessage(
                data.message || "If the email is unverified, a new link has been sent."
            );
        } else {
            setResendMessage(
                data.message ||
                "Could not resend the link. Please try again later."
            );
        }

        setResendLoading(false);
    };

    const iconColour =
        status === "success"
            ? "bg-emerald-50 text-emerald-600"
            : status === "checking"
                ? "bg-slate-100 text-slate-500"
                : "bg-red-50 text-red-600";

    const iconLabel =
        status === "success"
            ? "✓"
            : status === "checking"
                ? "…"
                : "!";

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
                    Email verification
                </h1>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-4">
                        <span
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${iconColour}`}
                        >
                            {iconLabel}
                        </span>
                        <div>
                            <p className="font-medium text-slate-900">
                                {status === "success"
                                    ? "Email verified"
                                    : status === "checking"
                                        ? "Verifying…"
                                        : "Something's off"}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-600">
                                {message ||
                                    "Checking your verification link…"}
                            </p>
                        </div>
                    </div>

                    {status === "success" && (
                        <div className="mt-6">
                            <Button
                                className="w-full"
                                onClick={() =>
                                    (window.location.href = "/login")
                                }
                            >
                                Continue to login
                            </Button>
                        </div>
                    )}

                    {status === "error" && (
                        <form onSubmit={handleResend} className="mt-6 space-y-4">
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
                            <Button
                                type="submit"
                                className="w-full"
                                loading={resendLoading}
                            >
                                Send a new verification link
                            </Button>
                            {resendMessage && (
                                <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                                    {resendMessage}
                                </p>
                            )}
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