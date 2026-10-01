import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
import useFormValidation from "../../hooks/useFormValidation";
import { rules } from "../../lib/validation";
import resetImage from "../../assets/cleaner2.jpg";

const HIGHLIGHTS = [
    "Secure new password in two taps",
    "Your requests, offers and jobs stay untouched",
    "Log in straight after you're done"
];

const SCHEMA = {
    email: [rules.required("Email address"), rules.email()],
    new_password: [
        rules.required("New password"),
        rules.strongPassword(),
        rules.maxLength(128, "Password is too long")
    ],
    confirm_password: [
        rules.required("Password confirmation"),
        rules.matches("new_password")
    ]
};

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const {
        values: form,
        errors,
        formError,
        announcement,
        handleChange,
        handleBlur,
        validateAll,
        setFormError
    } = useFormValidation({
        schema: SCHEMA,
        initialValues: {
            email: "",
            new_password: "",
            confirm_password: ""
        }
    });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // A missing token makes submission impossible, so it is surfaced as a
    // blocking notice rather than as a field error the user cannot act on.
    const missingToken = !token;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (missingToken) {
            setFormError(
                "This reset link is missing its security token. Request a new link from the Forgot password page."
            );

            return;
        }

        if (!validateAll(form)) {
            return;
        }

        setLoading(true);

        try {
            const data = await resetPassword({
                token,
                email: form.email.trim(),
                new_password: form.new_password
            });

            if (data.success) {
                setMessage(data.message);

                setTimeout(() => navigate("/login"), 1800);
            }
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                    "Unable to reset your password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            image={resetImage}
            imageSeed="Focused provider getting back to work"
            imageIcon="sparkles"
            eyebrow="Almost there — set a new password."
            highlights={HIGHLIGHTS}
        >
            <div>
                <Logo size="lg" brand="Quick" accent="Fix" />
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    Set a new password
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Choose a new password for your account.
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {message && (
                        <div
                            role="status"
                            className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
                        >
                            {message}
                        </div>
                    )}

                    {(formError || missingToken) && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {formError ||
                                "Missing reset token. Click the link from your email."}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <Input
                            label="Email address"
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="email"
                            autoCapitalize="none"
                            spellCheck="false"
                            error={errors.email}
                            required
                        />

                        <PasswordInput
                            label="New password"
                            id="new_password"
                            name="new_password"
                            value={form.new_password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            maxLength={128}
                            error={errors.new_password}
                            hint="At least 8 characters with a letter and a number."
                            strengthId="new-password-strength"
                            showStrength
                            required
                        />

                        <PasswordInput
                            label="Confirm new password"
                            id="confirm_password"
                            name="confirm_password"
                            value={form.confirm_password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            maxLength={128}
                            error={errors.confirm_password}
                            required
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            disabled={missingToken}
                            className="w-full"
                        >
                            {loading ? "Resetting..." : "Reset password"}
                        </Button>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
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
        </AuthShell>
    );
}

export default ResetPassword;
