import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [form, setForm] = useState({
        email: "",
        new_password: "",
        confirm_password: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!token) {
            setError("Missing reset token. Click the link from your email.");
            return;
        }

        if (form.new_password.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        if (form.new_password !== form.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const data = await resetPassword({
                token,
                email: form.email,
                new_password: form.new_password
            });

            if (data.success) {
                setMessage(data.message);

                setTimeout(() => navigate("/login"), 1800);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to reset your password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 py-16 sm:py-24">
            <div className="mx-auto w-full max-w-md px-4">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Set a new password
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Choose a new password for your account.
                    </p>

                    {message && (
                        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <Input
                            label="Email address"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />

                        <Input
                            label="New password"
                            id="new_password"
                            name="new_password"
                            type="password"
                            value={form.new_password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            hint="Must be at least 6 characters long."
                            minLength="6"
                            required
                        />

                        <Input
                            label="Confirm new password"
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />

                        <Button type="submit" loading={loading} className="w-full">
                            {loading ? "Resetting..." : "Reset password"}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        <Link
                            to="/login"
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            Back to login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;