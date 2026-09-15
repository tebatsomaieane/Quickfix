import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { changePassword, updateProfile } from "../../services/authService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import FileUpload from "../../components/ui/FileUpload";

function Settings() {
    const { user, setUser } = useAuth();

    const [profileForm, setProfileForm] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone: user?.phone || "",
        profile_image: user?.profile_image || "",
        location: user?.location || ""
    });
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);

    const [form, setForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileMessage("");
        setProfileError("");
        setProfileLoading(true);

        try {
            const data = await updateProfile({
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                phone: profileForm.phone,
                profile_image: profileForm.profile_image,
                location: profileForm.location
            });

            if (data.success) {
                setProfileMessage("Profile updated.");
                if (setUser && typeof setUser === "function") {
                    setUser(data.user);
                }
            }
        } catch (err) {
            setProfileError(
                err.response?.data?.message || "Unable to update profile."
            );
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (form.new_password.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        if (form.new_password !== form.confirm_password) {
            setError("New password and confirmation do not match.");
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
                setForm({
                    current_password: "",
                    new_password: "",
                    confirm_password: ""
                });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Unable to change your password."
            );
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

                    {profileMessage && (
                        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                            {profileMessage}
                        </div>
                    )}

                    {profileError && (
                        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {profileError}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                        <Input
                            label="First name"
                            id="first_name"
                            name="first_name"
                            value={profileForm.first_name}
                            onChange={handleProfileChange}
                            required
                        />

                        <Input
                            label="Last name"
                            id="last_name"
                            name="last_name"
                            value={profileForm.last_name}
                            onChange={handleProfileChange}
                            required
                        />

                        <Input
                            label="Phone"
                            id="phone"
                            name="phone"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            required
                            maxLength="30"
                        />

                        <Input
                            label="Location"
                            id="location"
                            name="location"
                            value={profileForm.location}
                            onChange={handleProfileChange}
                            placeholder="e.g. Maseru"
                            maxLength="255"
                        />

                        <FileUpload
                            label="Profile photo"
                            kind="image"
                            value={profileForm.profile_image}
                            onChange={(url) =>
                                setProfileForm({
                                    ...profileForm,
                                    profile_image: url
                                })
                            }
                            hint="Your photo lets customers see who they are talking to."
                        />

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
                            label="Current password"
                            id="current_password"
                            name="current_password"
                            type="password"
                            value={form.current_password}
                            onChange={handleChange}
                            autoComplete="current-password"
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

                        <Button type="submit" loading={loading}>
                            Update password
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default Settings;