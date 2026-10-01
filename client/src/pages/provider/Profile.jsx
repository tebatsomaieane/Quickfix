import { useCallback, useEffect, useState } from "react";
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
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";

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

const EMPTY_PROFILE = {
    description: "",
    profile_image: "",
    experience_years: "",
    location: "",
    service_area: ""
};

/**
 * Mirrors `content.providerProfile` on the server.
 *
 * Nothing here is required: the endpoint is a partial update and a provider
 * opening the page to correct a typo should not be blocked by fields they have
 * never filled in. Only the description has a floor, and only when it is
 * actually being written -- an empty overview is ignored by the server, while a
 * one-word one would be published to customers as this provider's bio.
 */
const PROFILE_SCHEMA = {
    description: [
        rules.minLength(
            20,
            "Write at least 20 characters so customers know what you do"
        ),
        rules.maxLength(5000, "Overview must be 5000 characters or fewer")
    ],
    experience_years: [
        rules.number({
            label: "Experience",
            integer: true,
            min: 0,
            max: 80
        })
    ],
    location: [rules.maxLength(255, "Location is too long")],
    service_area: [rules.maxLength(255, "Service area is too long")]
};

function ProviderProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
    const [error, setError] = useState("");

    // The schema lets each rejection land on the input that caused it instead of
    // a page-level banner, and the inline banner below is then reserved for
    // problems that name no single field.
    const {
        values: form,
        fieldErrors,
        formError,
        announcement,
        pending: saving,
        setValue,
        handleChange,
        handleBlur,
        validateAll,
        reset,
        run
    } = useActionFeedback({
        schema: PROFILE_SCHEMA,
        initialValues: EMPTY_PROFILE
    });

    // Availability is a separate save with its own button, so it gets its own
    // pending state rather than sharing one that would disable both buttons
    // while either is in flight.
    const { run: runAvailability, pending: savingAvailability } =
        useActionFeedback();

    const load = useCallback(() => {
        setLoading(true);
        fetchMyProviderProfile()
            .then((data) => {
                const p = data.data;
                setProfile(p);
                setError("");

                // Seed the form through the hook, so the values it validates are
                // the ones actually on screen.
                reset({
                    description: p.description || "",
                    profile_image: p.profile_image || "",
                    experience_years:
                        p.experience_years != null
                            ? String(p.experience_years)
                            : "",
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
    }, [reset]);

    useEffect(() => { load(); }, [load]);

    const handleAvailChange = (index, field, value) => {
        setAvailability((prev) => prev.map((a, i) => (
            i === index ? { ...a, [field]: value } : a
        )));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError("");

        if (!validateAll(form)) {
            return;
        }

        const experience = form.experience_years
            ? Number(form.experience_years)
            : 0;

        const { ok } = await run(
            () =>
                updateProviderProfile({
                    description: form.description,
                    profile_image: form.profile_image || null,
                    experience_years: experience,
                    location: form.location || null,
                    service_area: form.service_area || null
                }),
            { success: "Profile details saved.", retry: true }
        );

        if (ok) {
            load();
        }
    };

    const handleSaveAvailability = async () => {
        setError("");

        const inverted = availability.filter(
            (day) =>
                day.is_available &&
                day.start_time &&
                day.end_time &&
                day.end_time <= day.start_time
        );

        // Named up front, because a server-side rejection of this would be a
        // bare "invalid time" with no idea which of the seven days is at fault.
        if (inverted.length > 0) {
            setError(
                `Check the hours for ${inverted
                    .map((day) => day.day_of_week.toLowerCase())
                    .join(", ")} — the end time must be after the start time.`
            );

            return;
        }

        const { ok } = await runAvailability(
            () => updateProviderAvailability(availability),
            { success: "Availability saved.", retry: true }
        );

        if (ok) {
            load();
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

            {error && (
                <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
                <form onSubmit={handleSaveProfile} noValidate>
                    <Card className="p-6">
                        <h2 className="font-semibold text-slate-900">Profile details</h2>

                        {formError && (
                            <div
                                role="alert"
                                className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                                {formError}
                            </div>
                        )}

                        <div className="mt-5 space-y-4">
                            <Textarea
                                label="Overview / description"
                                id="description"
                                name="description"
                                rows="4"
                                value={form.description}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                maxLength={5000}
                                error={fieldErrors.description}
                                hint="Shown on your public profile. Say what you fix and where you work."
                                placeholder="Tell customers about your experience and what you offer."
                            />

                            <FileUpload
                                label="Profile photo"
                                name="profile_image"
                                kind="image"
                                value={form.profile_image}
                                onChange={(url) =>
                                    setValue("profile_image", url)
                                }
                                hint="A clear photo of your face builds trust with customers."
                                error={fieldErrors.profile_image}
                            />

                            <Input
                                label="Experience (years)"
                                id="experience_years"
                                name="experience_years"
                                type="number"
                                min="0"
                                max="80"
                                step="1"
                                value={form.experience_years}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={fieldErrors.experience_years}
                            />

                            <Input
                                label="Location"
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                maxLength={255}
                                error={fieldErrors.location}
                                placeholder="e.g. Maseru"
                            />

                            <Input
                                label="Service area"
                                id="service_area"
                                name="service_area"
                                value={form.service_area}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                maxLength={255}
                                error={fieldErrors.service_area}
                                placeholder="e.g. Maseru & Berea districts"
                            />
                        </div>

                        <div className="mt-5">
                            <Button type="submit" loading={saving}>
                                Save profile
                            </Button>
                        </div>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </Card>
                </form>

                <Card className="p-6">
                    <h2 className="font-semibold text-slate-900">Availability</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Set your working days and hours.
                    </p>

                    <div className="mt-5 space-y-4">
                        {availability.map((day, index) => {
                            // A day whose finish is at or before its start is
                            // silently stored and then never matches a job, so it
                            // is caught here with the specific day named.
                            const orderProblem =
                                day.is_available &&
                                day.start_time &&
                                day.end_time &&
                                day.end_time <= day.start_time;

                            return (
                            <div key={day.day_of_week} className="rounded-lg border border-slate-200 p-3">
                                <div className="flex flex-wrap items-center gap-3">
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
                                            <label className="sr-only" htmlFor={`avail-start-${day.day_of_week}`}>
                                                {day.day_of_week.toLowerCase()} start time
                                            </label>
                                            <input
                                                id={`avail-start-${day.day_of_week}`}
                                                type="time"
                                                value={day.start_time}
                                                onChange={(e) => handleAvailChange(index, "start_time", e.target.value)}
                                                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                            <span className="text-slate-400">to</span>
                                            <label className="sr-only" htmlFor={`avail-end-${day.day_of_week}`}>
                                                {day.day_of_week.toLowerCase()} end time
                                            </label>
                                            <input
                                                id={`avail-end-${day.day_of_week}`}
                                                type="time"
                                                value={day.end_time}
                                                onChange={(e) => handleAvailChange(index, "end_time", e.target.value)}
                                                aria-invalid={orderProblem ? true : undefined}
                                                className={[
                                                    "rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2",
                                                    orderProblem
                                                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                                        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100"
                                                ].join(" ")}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400">Not available</span>
                                    )}
                                </div>

                                {orderProblem && (
                                    <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                                        The end time for{" "}
                                        {day.day_of_week.toLowerCase()} must be
                                        after the start time.
                                    </p>
                                )}
                            </div>
                            );
                        })}

                        <Button variant="secondary" loading={savingAvailability} onClick={handleSaveAvailability}>
                            Save availability
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ProviderProfile;