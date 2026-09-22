import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
import forgotImage from "../../assets/cleaner.jpg";

const HIGHLIGHTS = [
    "We'll email you a secure reset link",
    "New password, same trusted marketplace",
    "Back in your dashboard within minutes"
];

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            const data = await forgotPassword(email);

            if (data.success) {
                setMessage(data.message);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to request a password reset."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            image={forgotImage}
            imageSeed="A friendly provider ready to lend a hand"
            imageIcon="wrench"
            eyebrow="We'll help you back in."
            highlights={HIGHLIGHTS}
        >
            <div>
                <Logo size="lg" brand="Quick" accent="Fix" />
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    Reset your password
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Enter the email address linked to your account and we will
                    send you a reset link.
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {message && (
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!message && (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <Input
                                label="Email address"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />

                            <Button
                                type="submit"
                                loading={loading}
                                className="w-full"
                            >
                                Send reset link
                            </Button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Remembered it?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
        </AuthShell>
    );
}

export default ForgotPassword;