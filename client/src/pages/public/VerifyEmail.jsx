import { useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resendVerification, verifyEmail } from "../../services/authService";
import AuthShell from "../../components/auth/AuthShell";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Logo from "../../components/ui/Logo";
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";
import verifyImage from "../../assets/cleaner.jpg";

/**
 * Mirrors `auth.verifyEmail` on the server: an address plus a PIN of exactly
 * six digits. The PIN box only ever holds digits (see `handlePinChange`), so the
 * rule here is really catching the two things a user can still get wrong --
 * leaving it empty, or typing fewer than six.
 */
const SCHEMA = {
    email: [rules.required("Email address"), rules.email()],
    pin: [
        rules.required("Verification PIN"),
        rules.digits(6, "Your PIN is 6 digits")
    ]
};

function VerifyEmail() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    // The address arrives in the query string from registration, so it is
    // prefilled. Memoised because the hook takes its initial values as the
    // reset target, and a fresh object each render would rebuild it needlessly.
    const initialValues = useMemo(
        () => ({ email: params.get("email") || "", pin: "" }),
        [params]
    );

    const {
        values,
        fieldErrors,
        formError,
        announcement,
        pending,
        setValue,
        handleChange,
        handleBlur,
        validateAll,
        run
    } = useActionFeedback({ schema: SCHEMA, initialValues });

    const [verified, setVerified] = useState(false);
    const [resendNotice, setResendNotice] = useState("");

    // Kept digits-only and capped at six, so the field cannot hold something the
    // server would only reject. `maxLength` would not stop a pasted "12 34 56".
    const handlePinChange = (event) => {
        setValue("pin", event.target.value.replace(/\D/g, "").slice(0, 6));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setResendNotice("");

        if (!validateAll(values)) {
            return;
        }

        const email = values.email.trim();

        const { ok } = await run(() => verifyEmail(email, values.pin.trim()));

        if (ok) {
            setVerified(true);
        }
    };

    const handleResend = async () => {
        const email = values.email.trim();

        // A resend with no address has nowhere to go, so say so on the field
        // rather than sending a request that cannot succeed.
        if (!email) {
            setValue("email", "");
            setResendNotice("Enter your email address to resend the PIN.");

            return;
        }

        setResendNotice("");

        const { ok } = await run(() => resendVerification(email), {
            success: "A new verification PIN is on its way",
            retry: true
        });

        if (ok) {
            setResendNotice("Check your inbox and spam folder for the new PIN.");
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
                    {verified ? "Email verified" : "Verify your email"}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    {verified
                        ? "Your QuickFix account is now active."
                        : "Enter the 6-digit PIN we emailed you (check spam too). It expires in 10 minutes."}
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {verified ? (
                        <div role="status">
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
                                onClick={() => navigate("/login")}
                            >
                                Continue to login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            {formError && (
                                <div
                                    role="alert"
                                    className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {formError}
                                </div>
                            )}

                            <Input
                                label="Email address"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="example@email.com"
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="email"
                                autoCapitalize="none"
                                spellCheck="false"
                                error={fieldErrors.email}
                                required
                            />

                            <Input
                                label="6-digit verification PIN"
                                id="pin"
                                name="pin"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                value={values.pin}
                                onChange={handlePinChange}
                                onBlur={handleBlur}
                                hint="Sent to your email at registration."
                                maxLength={6}
                                error={fieldErrors.pin}
                                required
                            />

                            <Button type="submit" className="w-full" loading={pending}>
                                {pending ? "Verifying…" : "Verify email"}
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
                                    loading={pending}
                                >
                                    Resend verification PIN
                                </Button>
                                {resendNotice && (
                                    <p
                                        role="status"
                                        className="mt-2 text-sm text-indigo-700"
                                    >
                                        {resendNotice}
                                    </p>
                                )}
                            </div>

                            {/* Announces validation outcomes that are not tied to
                                a single field, so the count is not purely
                                visual. */}
                            <p aria-live="polite" className="sr-only">
                                {announcement}
                            </p>
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