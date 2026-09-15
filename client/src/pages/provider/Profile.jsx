import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
    fetchMyProviderProfile
} from "../../services/catalogueService";
import {
    updateProviderProfile,
    updateProviderAvailability
} from "../../services/providerService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import FileUpload from "../../components/ui/FileUpload";

const DAYS = [
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
    "FRIDAY", "SATURDAY", "SUNDAY"
];

const DEFAULT_AVAILABILITY = DAYS.map((day) => ({
    day_of_week: day,
    start_time: "09:00",
    end_time: "17:00",
    is_available: true
}));

const VERIFICATION_COLORS = {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "red"
};

function ProviderProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        description: "",
        profile_image: "",
        experience_years: "",
        location: "",
        service_area: ""
    });
    const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        fetchMyProviderProfile()
            .then((data) => {
                const p = data.data;
                setProfile(p);
                setForm({
                    description: p.description || "",
                    profile_image: p.profile_image || "",
                    experience_years: p.experience_years != null ? String(p.experience_years) : "",
                    location: p.location || "",
                    service_area: p.service_area || ""
                });
                if (Array.isArray(p.availability) && p.availability.length) {
                    const byDay = {};
                    p.availability.forEach((a) => {
                        byDay[a.day_of_week] = a;
                    });
                    setAvailability(
                        DAYS.map((day) => (
                            byDay[day]
                                ? {
                                      day_of_week: day,
                                      start_time: String(byDay[day].start_time || "").slice(0, 5),
                                      end_time: String(byDay[day].end_time || "").slice(0, 5),
                                      is_available: Boolean(byDay[day].is_available)
                                  }
                                : {
                                      day_of_week: day,
                                      start_time: "09:00",
                                      end_time: "17:00",
                                      is_available: true
                                  }
                        ))
                    );
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleAvailChange = (index, field, value) => {
        setAvailability((prev) => prev.map((a, i) => (
            i === index ? { ...a, [field]: value } : a
        )));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const experience = form.experience_years
            ? Number(form.experience_years)
            : 0;

        if (experience < 0 || experience > 100) {
            setError("Experience must be between 0 and 100 years.");
            return;
        }

        setSaving(true);
        try {
            const data = await updateProviderProfile({
                description: form.description,
                profile_image: form.profile_image || null,
                experience_years: experience,
                location: form.location || null,
                service_area: form.service_area || null
            });
            if (data.success) {
                setMessage("Profile details saved.");
                load();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAvailability = async () => {
        setMessage("");
        setError("");
        setSaving(true);
        try {
            const data = await updateProviderAvailability(availability);
            if (data.success) {
                setMessage("Availability saved.");
                load();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save availability.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    {user?.first_name} {user?.last_name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Manage how customers see you on QuickFix.
                </p>
            </div>

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

            {profile && (
                <div className="mb-4">
                    <Badge color={VERIFICATION_COLORS[profile.verification_status] || "gray"}>
                        {profile.verification_status.toLowerCase().replace("_", " ")}
                    </Badge>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={handleSaveProfile}>
                    <Card className="p-6">
                        <h2 className="font-semibold text-slate-900">Profile details</h2>

                        <div className="mt-5 space-y-4">
                            <div>
                                <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Overview / description
                                </label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows="4"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Tell customers about your experience and what you offer."
                                />
                            </div>

                            <FileUpload
                                label="Profile photo"
                                kind="image"
                                value={form.profile_image}
                                onChange={(url) =>
                                    setForm({ ...form, profile_image: url })
                                }
                                hint="A clear photo of your face builds trust with customers."
                            />

                            <Input
                                label="Experience (years)"
                                id="experience_years"
                                name="experience_years"
                                type="number"
                                min="0"
                                max="100"
                                value={form.experience_years}
                                onChange={handleChange}
                            />

                            <Input
                                label="Location"
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder="e.g. Maseru"
                            />

                            <Input
                                label="Service area"
                                id="service_area"
                                name="service_area"
                                value={form.service_area}
                                onChange={handleChange}
                                placeholder="e.g. Maseru & Berea districts"
                            />
                        </div>

                        <div className="mt-5">
                            <Button type="submit" loading={saving}>
                                Save profile
                            </Button>
                        </div>
                    </Card>
                </form>

                <Card className="p-6">
                    <h2 className="font-semibold text-slate-900">Availability</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Set your working days and hours.
                    </p>

                    <div className="mt-5 space-y-4">
                        {availability.map((day, index) => (
                            <div key={day.day_of_week} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id={`avail-${day.day_of_week}`}
                                        checked={day.is_available}
                                        onChange={(e) => handleAvailChange(index, "is_available", e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`avail-${day.day_of_week}`} className="w-24 text-sm font-medium text-slate-700">
                                        {day.day_of_week.toLowerCase()}
                                    </label>
                                </div>
                                {day.is_available ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={day.start_time}
                                            onChange={(e) => handleAvailChange(index, "start_time", e.target.value)}
                                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                        <span className="text-slate-400">to</span>
                                        <input
                                            type="time"
                                            value={day.end_time}
                                            onChange={(e) => handleAvailChange(index, "end_time", e.target.value)}
                                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">Not available</span>
                                )}
                            </div>
                        ))}

                        <Button variant="secondary" loading={saving} onClick={handleSaveAvailability}>
                            Save availability
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ProviderProfile;