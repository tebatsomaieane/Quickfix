import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import PasswordInput from "../../components/ui/PasswordInput";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
import useFormValidation from "../../hooks/useFormValidation";
import { rules } from "../../lib/validation";
import customerRoleImage from "../../assets/servicerequestperson.jpg";
import providerRoleImage from "../../assets/electrician.jpg";
import businessRoleImage from "../../assets/restaurant.jpg";

const ROLE_OPTIONS = [
    { value: "CUSTOMER", label: "I need services" },
    { value: "PROVIDER", label: "I provide services" },
    { value: "BUSINESS_OWNER", label: "I own a service business" }
];

const ROLE_CREATIVE = {
    CUSTOMER: {
        image: customerRoleImage,
        eyebrow: "Request any service, close to home.",
        seed: "A customer sharing what needs fixing"
    },
    PROVIDER: {
        image: providerRoleImage,
        eyebrow: "Turn your skill into a steady income.",
        seed: "A verified provider on the job"
    },
    BUSINESS_OWNER: {
        image: businessRoleImage,
        eyebrow: "Put your store or café on the map.",
        seed: "A local store customers discover on QuickFix"
    }
};

const HIGHLIGHTS = [
    "Create a free account in under a minute",
    "Get matched with verified local providers",
    "Stores and cafés can advertise products too"
];

const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard"
};

const INITIAL_VALUES = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role: "CUSTOMER",
    terms_accepted: false
};

/**
 * Mirrors the server's registration contract, then adds one check it does
 * not perform: a password confirmation. The strength and identity rules are
 * the same on both sides, so a form this form accepts is a form the API
 * accepts, and a valid submission never makes a pointless round-trip to be
 * told what was wrong.
 */
const SCHEMA = {
    first_name: [
        rules.required("First name"),
        rules.minLength(2, "First name is too short"),
        rules.name(),
        rules.maxLength(50, "First name must be 50 characters or fewer")
    ],
    last_name: [
        rules.required("Last name"),
        rules.minLength(2, "Last name is too short"),
        rules.name(),
        rules.maxLength(50, "Last name must be 50 characters or fewer")
    ],
    email: [rules.required("Email address"), rules.email()],
    phone: [
        rules.required("Phone number"),
        rules.phone(),
        rules.maxLength(30, "Phone number must be 30 characters or fewer")
    ],
    password: [
        rules.required("Password"),
        rules.strongPassword(),
        rules.passwordExcludesIdentity(),
        rules.maxLength(128, "Password is too long")
    ],
    confirm_password: [
        rules.required("Password confirmation"),
        rules.matches("password")
    ],
    role: [rules.required("Account type")],
    // A plain boolean rule rather than `required`, which treats false as a
    // provided value. Client-side only: the API never sees this field.
    terms_accepted: [
        (value) =>
            value
                ? null
                : "Please accept the Terms & Conditions and Privacy Policy"
    ]
};

function Register() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const {
        values,
        errors,
        formError,
        announcement,
        handleChange,
        handleBlur,
        setValue,
        validateAll,
        applyServerError,
        reset
    } = useFormValidation({ schema: SCHEMA, initialValues: INITIAL_VALUES });

    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setSuccess("");

        if (!validateAll(values)) {
            return;
        }

        setLoading(true);

        try {
            // confirm_password is a client-side concern only and must not reach
            // the API, which would reject or store an unknown column.
            const payload = {
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
                email: values.email.trim(),
                phone: values.phone.trim(),
                password: values.password,
                role: values.role
            };

            const data = await registerUser({
                ...payload,
                first_name: payload.first_name.trim(),
                last_name: payload.last_name.trim(),
                email: payload.email.trim(),
                phone: payload.phone.trim()
            });

            if (data.success) {
                // The API issues the session cookie in the same response, so
                // the account is usable immediately: seed the auth state and
                // go straight to the dashboard the role was chosen for.
                setSuccess("Account created! Taking you to your dashboard…");
                reset(INITIAL_VALUES);
                setUser(data.user);

                // Let the success message register before the route changes,
                // so the user is not left wondering whether it worked.
                await new Promise((resolve) => setTimeout(resolve, 900));

                navigate(ROLE_PATHS[data.user.role] || "/");
            } else {
                applyServerError({ data });
            }
        } catch (requestError) {
            applyServerError(requestError);
        } finally {
            setLoading(false);
        }
    };

    const creative = ROLE_CREATIVE[values.role] || ROLE_CREATIVE.CUSTOMER;

    return (
        <AuthShell
            image={creative.image}
            imageSeed={creative.seed}
            imageIcon="users"
            eyebrow={creative.eyebrow}
            highlights={HIGHLIGHTS}
        >
            <div>
                <Logo size="lg" brand="Quick" accent="Fix" />
                <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                    Join QuickFix
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Create your account and connect with trusted service
                    professionals.
                </p>

                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {formError && (
                        <div
                            role="alert"
                            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {formError}
                        </div>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
                        >
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                label="First name"
                                id="first_name"
                                name="first_name"
                                placeholder="First name"
                                value={values.first_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="given-name"
                                maxLength={50}
                                error={errors.first_name}
                                required
                            />

                            <Input
                                label="Last name"
                                id="last_name"
                                name="last_name"
                                placeholder="Last name"
                                value={values.last_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="family-name"
                                maxLength={50}
                                error={errors.last_name}
                                required
                            />
                        </div>

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
                            error={errors.email}
                            hint="You'll sign in with this address."
                            required
                        />

                        <Input
                            label="Phone number"
                            id="phone"
                            type="tel"
                            name="phone"
                            placeholder="+266 ..."
                            value={values.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="tel"
                            inputMode="tel"
                            maxLength={30}
                            error={errors.phone}
                            hint="Required — e.g. +266 6222 2222"
                            required
                        />

                        <PasswordInput
                            label="Password"
                            id="password"
                            name="password"
                            placeholder="Create a password"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            maxLength={128}
                            error={errors.password}
                            hint="At least 8 characters with a letter and a number."
                            strengthId="password-strength"
                            showStrength
                            required
                        />

                        <PasswordInput
                            label="Confirm password"
                            id="confirm_password"
                            name="confirm_password"
                            placeholder="Re-enter your password"
                            value={values.confirm_password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="new-password"
                            maxLength={128}
                            error={errors.confirm_password}
                            required
                        />

                        <Select
                            label="What are you here for?"
                            id="role"
                            name="role"
                            value={values.role}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            options={ROLE_OPTIONS}
                            error={errors.role}
                        />

                        <div>
                            <label
                                htmlFor="terms_accepted"
                                className="flex cursor-pointer items-start gap-3"
                            >
                                <input
                                    type="checkbox"
                                    id="terms_accepted"
                                    name="terms_accepted"
                                    checked={values.terms_accepted}
                                    onChange={(event) =>
                                        setValue(
                                            "terms_accepted",
                                            event.target.checked
                                        )
                                    }
                                    aria-invalid={
                                        errors.terms_accepted
                                            ? "true"
                                            : undefined
                                    }
                                    aria-describedby={
                                        errors.terms_accepted
                                            ? "terms_accepted-error"
                                            : undefined
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                                />
                                <span className="text-sm text-slate-600">
                                    I agree to the{" "}
                                    <Link
                                        to="/terms"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Terms &amp; Conditions
                                    </Link>{" "}
                                    and{" "}
                                    <Link
                                        to="/privacy"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Privacy Policy
                                    </Link>
                                    , including the use of cookies as described
                                    in the{" "}
                                    <Link
                                        to="/cookies"
                                        onClick={(event) =>
                                            event.stopPropagation()
                                        }
                                        className="font-semibold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Cookie Policy
                                    </Link>
                                    .
                                </span>
                            </label>

                            {errors.terms_accepted && (
                                <p
                                    id="terms_accepted-error"
                                    role="alert"
                                    className="mt-1.5 pl-7 text-xs font-medium text-red-600"
                                >
                                    {errors.terms_accepted}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </Button>

                        {/* Announces validation outcomes that are not tied to a
                            single field, so the count is not purely visual. */}
                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Already have an account?{" "}
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

export default Register;
