import { useCallback, useEffect, useState } from "react";
import {
    fetchProfile,
    updateProfile,
    requestVerification
} from "../../services/businessService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import SmartImage from "../../components/ui/SmartImage";
import FileUpload from "../../components/ui/FileUpload";
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";

const VERIFICATION_COLORS = {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "red"
};

const EMPTY_FORM = {
    name: "",
    description: "",
    phone: "",
    email: "",
    location: "",
    operating_hours: "",
    logo: "",
    cover_image: ""
};

/**
 * Mirrors `content.businessProfile` on the server, which is a partial update:
 * an empty `email` is how a business removes its contact address, so blank is
 * allowed there rather than treated as missing.
 *
 * The name is the one field required here, and only on this form. The server
 * stays permissive because it also backs "remove the name" style calls, but a
 * nameless public listing is not something a user means to publish.
 */
const SCHEMA = {
    name: [
        rules.required("Business name"),
        rules.minLength(2, "Business name must be at least 2 characters"),
        rules.maxLength(200, "Business name must be 200 characters or fewer")
    ],
    description: [
        rules.maxLength(5000, "Description must be 5000 characters or fewer")
    ],
    phone: [rules.phone()],
    email: [rules.email()],
    location: [rules.maxLength(255, "Location is too long")],
    operating_hours: [
        rules.maxLength(1000, "Operating hours must be 1000 characters or fewer")
    ],
    logo: [rules.maxLength(500, "Logo reference is too long")],
    cover_image: [rules.maxLength(500, "Cover photo reference is too long")]
};

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

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
    } = useActionFeedback({ schema: SCHEMA, initialValues: EMPTY_FORM });

    // Requesting verification is a separate one-click action with its own
    // button, so it does not share the save button's pending state.
    const { run: runVerification, pending: requesting } =
        useActionFeedback();

    const load = useCallback(() => {
        setLoading(true);
        fetchProfile()
            .then((data) => {
                setProfile(data.data);
                reset({
                    name: data.data.name || "",
                    description: data.data.description || "",
                    phone: data.data.phone || "",
                    email: data.data.email || "",
                    location: data.data.location || "",
                    operating_hours: data.data.operating_hours || "",
                    logo: data.data.logo || "",
                    cover_image: data.data.cover_image || ""
                });
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [reset]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (e) => {
        e.preventDefault();

        if (!validateAll(form)) {
            return;
        }

        const { ok } = await run(() => updateProfile(form), {
            success: "Profile updated.",
            retry: true
        });

        if (ok) {
            setEditMode(false);
            load();
        }
    };

    const handleRequestVerification = async () => {
        const { ok } = await runVerification(() => requestVerification(), {
            success: "Verification requested. We'll review it soon.",
            retry: true
        });

        if (ok) {
            load();
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    if (!profile) {
        return <Card className="p-8 text-center"><p className="text-slate-500">Unable to load business profile.</p></Card>;
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                    <p className="mt-1 text-sm text-slate-500">Business profile</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge color={VERIFICATION_COLORS[profile.verification_status] || "gray"}>
                        {profile.verification_status.toLowerCase().replace("_", " ")}
                    </Badge>
                    {profile.verification_status !== "APPROVED" &&
                     profile.verification_status !== "PENDING" && (
                        <Button
                            size="sm"
                            variant="secondary"
                            loading={requesting}
                            onClick={handleRequestVerification}
                        >
                            Request verification
                        </Button>
                    )}
                    {!editMode && (
                        <Button size="sm" onClick={() => setEditMode(true)}>Edit profile</Button>
                    )}
                </div>
            </div>

            {editMode ? (
                <Card className="max-w-2xl p-6">
                    {formError && <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSave} noValidate className="space-y-4">
                        <Input
                            label="Business name"
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={200}
                            error={fieldErrors.name}
                            required
                        />

                        <Textarea
                            label="Description"
                            id="description"
                            name="description"
                            rows="3"
                            value={form.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={5000}
                            error={fieldErrors.description}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Phone"
                                id="phone"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                value={form.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                maxLength={30}
                                error={fieldErrors.phone}
                            />
                            <Input
                                label="Email"
                                id="email"
                                name="email"
                                type="email"
                                autoCapitalize="none"
                                spellCheck="false"
                                value={form.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={fieldErrors.email}
                                hint="Leave blank to remove your contact address."
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Location"
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                maxLength={255}
                                error={fieldErrors.location}
                            />
                            <Input
                                label="Operating hours"
                                id="operating_hours"
                                name="operating_hours"
                                value={form.operating_hours}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                maxLength={1000}
                                error={fieldErrors.operating_hours}
                                placeholder="Mon–Fri: 8:00–17:00"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FileUpload
                                label="Logo"
                                name="logo"
                                kind="image"
                                value={form.logo}
                                onChange={(url) => setValue("logo", url)}
                                error={fieldErrors.logo}
                            />
                            <FileUpload
                                label="Cover photo"
                                name="cover_image"
                                kind="image"
                                value={form.cover_image}
                                onChange={(url) => setValue("cover_image", url)}
                                error={fieldErrors.cover_image}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit" loading={saving}>Save</Button>
                            <Button variant="secondary" type="button" onClick={() => { setEditMode(false); load(); }}>Cancel</Button>
                        </div>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </form>
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="overflow-hidden p-0">
                        <SmartImage
                            src={profile.cover_image}
                            seed={`${profile.name}-cover`}
                            icon="building"
                            className="h-44 w-full object-cover"
                        />
                        <div className="-mt-10 flex flex-wrap items-end gap-4 px-6 pb-5">
                            <SmartImage
                                src={profile.logo}
                                seed={`${profile.name}-logo`}
                                icon="building"
                                className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow"
                            />
                            <div className="min-w-0 flex-1 pb-1">
                                <p className="text-lg font-extrabold text-slate-900">
                                    {profile.name}
                                </p>
                                {profile.description && (
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        {profile.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                    <Card className="max-w-2xl p-6">
                        <div className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div><span className="font-medium text-slate-500">Phone</span><p className="mt-0.5 text-slate-900">{profile.phone || "—"}</p></div>
                            <div><span className="font-medium text-slate-500">Email</span><p className="mt-0.5 text-slate-900">{profile.email || "—"}</p></div>
                            <div><span className="font-medium text-slate-500">Location</span><p className="mt-0.5 text-slate-900">{profile.location || "—"}</p></div>
                            <div><span className="font-medium text-slate-500">Hours</span><p className="mt-0.5 text-slate-900">{profile.operating_hours || "—"}</p></div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default Profile;