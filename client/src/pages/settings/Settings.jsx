import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { changePassword, resendVerification, updateProfile } from "../../services/authService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import PasswordInput from "../../components/ui/PasswordInput";
import FileUpload from "../../components/ui/FileUpload";
import useFormValidation from "../../hooks/useFormValidation";
import { rules } from "../../lib/validation";

const PROFILE_SCHEMA = {
    first_name: [
        rules.required("First name"),
        rules.name(),
        rules.maxLength(100, "First name must be 100 characters or fewer")
    ],
    last_name: [
        rules.required("Last name"),
        rules.name(),
        rules.maxLength(100, "Last name must be 100 characters or fewer")
    ],
    phone: [
        rules.required("Phone number"),
        rules.phone(),
        rules.maxLength(30, "Phone number must be 30 characters or fewer")
    ]
};

const PASSWORD_SCHEMA = {
    current_password: [rules.required("Current password")],
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

function Settings() {
    const { user, setUser } = useAuth();

    // The API only stores photo and location on the customer profile row, so
    // showing those controls to any other role produced a form that reported
    // "Profile updated" while silently discarding both values.
    const canEditPhotoAndLocation = user?.role === "CUSTOMER";

    const {
        values: profileForm,
        errors: profileErrors,
        formError: profileFormError,
        setValue: setProfileValue,
        setFormError: setProfileFormError,
        handleChange: handleProfileChange,
        handleBlur: handleProfileBlur,
        validateAll: validateProfile
    } = useFormValidation({
        schema: PROFILE_SCHEMA,
        initialValues: {
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            phone: user?.phone || "",
            profile_image: user?.profile_image || "",
            location: user?.location || ""
        }
    });

    const {
        values: form,
        errors,
        formError,
        announcement,
        handleChange,
        handleBlur,
        validateAll,
        applyServerError,
        setFormError,
        reset
    } = useFormValidation({
        schema: PASSWORD_SCHEMA,
        initialValues: {
            current_password: "",
            new_password: "",
            confirm_password: ""
        }
    });

    const [profileMessage, setProfileMessage] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifySent, setVerifySent] = useState(false);
    const [verifyError, setVerifyError] = useState("");

    const handleResendVerification = async () => {
        setVerifySent(false);
        setVerifyError("");

        try {
            const data = await resendVerification(user?.email || "");

            if (data.success) {
                setVerifySent(true);
            } else {
                setVerifyError(data.message || "Could not send the link.");
            }
        } catch (err) {
            setVerifyError(
                err.response?.data?.message || "Could not send the link."
            );
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileMessage("");

        if (!validateProfile(profileForm)) {
            return;
        }

        setProfileLoading(true);

        try {
            const payload = {
                first_name: profileForm.first_name.trim(),
                last_name: profileForm.last_name.trim(),
                phone: profileForm.phone.trim()
            };

            // Only send the customer-only columns when the API will actually
            // store them; otherwise they are stripped server-side and the save
            // would claim success without changing anything.
            if (canEditPhotoAndLocation) {
                payload.profile_image = profileForm.profile_image;
                payload.location = profileForm.location.trim();
            }

            const data = await updateProfile(payload);

            if (data.success) {
                setProfileMessage("Profile updated.");
                if (setUser && typeof setUser === "function") {
                    setUser({ ...user, ...data.user });
                }
            }
        } catch (err) {
            setProfileFormError(
                err.response?.data?.message || "Unable to update profile."
            );
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!validateAll(form)) {
            return;
        }

        setLoading(true);

        try {
            const data = await changePassword({
                current_password: form.current_password,
                new_password: form.new_password
            });

            if (data.success) {
                setMessage(data.message);
                reset();
            }
        } catch (err) {
            // "Current password is incorrect" has to land on the current
            // password field. The shared mapper keys on "password", which is
            // not a field in this form, so it is retargeted here.
            const message = err.response?.data?.message;

            if (message?.toLowerCase().includes("current password")) {
                applyServerError({
                    ...err,
                    response: {
                        ...err.response,
                        data: { message: "Current password is incorrect" }
                    }
                });
            } else if (message?.toLowerCase().includes("password")) {
                // A rejected new password is reported on `new_password`, not
                // on a `password` field this form does not have.
                applyServerError({
                    ...err,
                    response: {
                        ...err.response,
                        data: { message: `New ${message}` }
                    }
                });
            } else {
                setFormError(
                    message || "Unable to change your password."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Settings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Manage your personal details and account security.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                    <h2 className="font-semibold text-slate-900">
                        Personal details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Signed in as {user?.email}.
                    </p>

                    {!user?.email_verified && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-medium text-amber-800">
                                Your email is not verified yet.
                            </p>
                            <p className="mt-1 text-xs text-amber-700">
                                Verified emails keep your account safe and are
                                required before requesting or offering services.
                            </p>
                            {!verifySent && (
                                <Button
                                    className="mt-3"
                                    variant="outline"
                                    onClick={handleResendVerification}
                                >
                                    Resend verification email
                                </Button>
                            )}
                            {verifySent && (
                                <p className="mt-2 text-sm text-emerald-700">
                                    A new verification link was sent. Check your
                                    inbox (and spam).
                                </p>
                            )}
                            {verifyError && (
                                <p className="mt-2 text-sm text-red-600">
                                    {verifyError}
                                </p>
                            )}
                        </div>
                    )}

                    {profileMessage && (
                        <div role="status" className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {profileMessage}
                        </div>
                    )}

                    {profileFormError && (
                        <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {profileFormError}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} noValidate className="mt-5 space-y-4">
                        <Input
                            label="First name"
                            id="first_name"
                            name="first_name"
                            value={profileForm.first_name}
                            onChange={handleProfileChange}
                            onBlur={handleProfileBlur}
                            maxLength={100}
                            error={profileErrors.first_name}
                            required
                        />

                        <Input
                            label="Last name"
                            id="last_name"
                            name="last_name"
                            value={profileForm.last_name}
                            onChange={handleProfileChange}
                            onBlur={handleProfileBlur}
                            maxLength={100}
                            error={profileErrors.last_name}
                            required
                        />

                        <Input
                            label="Phone"
                            id="phone"
                            type="tel"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            onBlur={handleProfileBlur}
                            autoComplete="tel"
                            maxLength={30}
                            error={profileErrors.phone}
                            required
                        />

                        {canEditPhotoAndLocation && (
                            <>
                                <Input
                                    label="Location"
                                    id="location"
                                    name="location"
                                    value={profileForm.location}
                                    onChange={handleProfileChange}
                                    onBlur={handleProfileBlur}
                                    placeholder="e.g. Maseru"
                                    maxLength={255}
                                    hint="Helps providers find jobs near you."
                                />

                                <FileUpload
                                    label="Profile photo"
                                    name="profile_image"
                                    kind="image"
                                    value={profileForm.profile_image}
                                    onChange={(url) =>
                                        setProfileValue("profile_image", url)
                                    }
                                    hint="Your photo lets customers see who they are talking to."
                                />
                            </>
                        )}

                        <Button type="submit" loading={profileLoading}>
                            Update profile
                        </Button>
                    </form>
                </Card>

                <Card className="p-6">
                    <h2 className="font-semibold text-slate-900">
                        Change password
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Keep your account secure.
                    </p>

                    {message && (
                        <div role="status" className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {message}
                        </div>
                    )}

                    {formError && (
                        <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                        <PasswordInput
                            label="Current password"
                            id="current_password"
                            name="current_password"
                            value={form.current_password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            autoComplete="current-password"
                            error={errors.current_password}
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

                        <Button type="submit" loading={loading}>
                            Update password
                        </Button>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default Settings;