import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../services/authService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Logo from "../../components/ui/Logo";
import AuthShell from "../../components/auth/AuthShell";
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

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        role: "CUSTOMER"
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previousData) => ({
            ...previousData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (!formData.phone.trim()) {
            setError("Please enter your phone number.");
            return;
        }

        if (formData.phone.trim().length > 30) {
            setError("Phone number must be 30 characters or fewer.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim()
            };

            const data = await registerUser(payload);

            if (data.success) {
                if (data.verification === "sent") {
                    setSuccess(
                        "Account created! Check your email for the 6-digit verification PIN (check spam too)."
                    );
                } else {
                    setSuccess("Registration successful!");
                }

                setFormData({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    password: "",
                    role: "CUSTOMER"
                });

                await new Promise((resolve) => setTimeout(resolve, 1500));

                navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
            } else {
                setError(
                    data.message || "Registration failed. Please try again."
                );
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to connect to QuickFix. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const creative = ROLE_CREATIVE[formData.role] || ROLE_CREATIVE.CUSTOMER;

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
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Input
                                label="First name"
                                id="first_name"
                                name="first_name"
                                placeholder="First name"
                                value={formData.first_name}
                                onChange={handleChange}
                                autoComplete="given-name"
                                required
                            />

                            <Input
                                label="Last name"
                                id="last_name"
                                name="last_name"
                                placeholder="Last name"
                                value={formData.last_name}
                                onChange={handleChange}
                                autoComplete="family-name"
                                required
                            />
                        </div>

                        <Input
                            label="Email address"
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
                            label="Phone number"
                            id="phone"
                            type="tel"
                            name="phone"
                            placeholder="+266 ..."
                            value={formData.phone}
                            onChange={handleChange}
                            autoComplete="tel"
                            maxLength="30"
                            hint="Required — e.g. +266 6222 2222"
                            required
                        />

                        <Input
                            label="Password"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            hint="Must be at least 6 characters long."
                            minLength="6"
                            required
                        />

                        <Select
                            label="What are you here for?"
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            options={ROLE_OPTIONS}
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </Button>
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