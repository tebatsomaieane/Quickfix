import { useEffect, useState } from "react";
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

const VERIFICATION_COLORS = {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "red"
};

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({});
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [saving, setSaving] = useState(false);
    const [requesting, setRequesting] = useState(false);

    const load = () => {
        setLoading(true);
        fetchProfile()
            .then((data) => {
                setProfile(data.data);
                setForm({
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
    };

    useEffect(() => { load(); }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");
        setSaving(true);

        try {
            await updateProfile(form);
            setFormSuccess("Profile updated.");
            setEditMode(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Update failed.");
        } finally {
            setSaving(false);
        }
    };

    const handleRequestVerification = async () => {
        setRequesting(true);
        try {
            await requestVerification();
            load();
        } catch {} finally {
            setRequesting(false);
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

            {formSuccess && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{formSuccess}</div>}

            {editMode ? (
                <Card className="max-w-2xl p-6">
                    {formError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSave} className="space-y-4">
                        <Input label="Business name" id="name" name="name" value={form.name} onChange={handleChange} required />
                        <div>
                            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                            <Textarea id="description" name="description" rows="3" value={form.description} onChange={handleChange} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Phone" id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
                            <Input label="Email" id="email" name="email" type="email" value={form.email} onChange={handleChange} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Location" id="location" name="location" value={form.location} onChange={handleChange} />
                            <Input label="Operating hours" id="operating_hours" name="operating_hours" value={form.operating_hours} onChange={handleChange} placeholder="Mon–Fri: 8:00–17:00" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FileUpload
                                label="Logo"
                                kind="image"
                                value={form.logo}
                                onChange={(url) =>
                                    setForm({ ...form, logo: url })
                                }
                            />
                            <FileUpload
                                label="Cover photo"
                                kind="image"
                                value={form.cover_image}
                                onChange={(url) =>
                                    setForm({ ...form, cover_image: url })
                                }
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="submit" loading={saving}>Save</Button>
                            <Button variant="secondary" type="button" onClick={() => { setEditMode(false); load(); }}>Cancel</Button>
                        </div>
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