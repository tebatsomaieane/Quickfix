import { useEffect, useState } from "react";
import {
    fetchMyAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement
} from "../../services/businessService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/format";

function Advertisements() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", start_date: "", end_date: "", image: "" });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        fetchMyAdvertisements()
            .then((data) => setAds(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const resetForm = () => {
        setForm({ title: "", description: "", start_date: "", end_date: "", image: "" });
        setEditId(null);
        setShowForm(false);
        setFormError("");
    };

    const handleEdit = (ad) => {
        setForm({
            title: ad.title,
            description: ad.description || "",
            start_date: ad.start_date?.slice(0, 10) || "",
            end_date: ad.end_date?.slice(0, 10) || "",
            image: ad.image || ""
        });
        setEditId(ad.id);
        setShowForm(true);
        setFormError("");
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!form.title.trim()) { setFormError("Title is required."); return; }
        if (!form.start_date) { setFormError("Start date is required."); return; }
        if (!form.end_date) { setFormError("End date is required."); return; }

        setSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                image: form.image.trim() || null,
                start_date: form.start_date,
                end_date: form.end_date
            };

            if (editId) {
                await updateAdvertisement(editId, payload);
            } else {
                await createAdvertisement(payload);
            }
            resetForm();
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || "Action failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try { await deleteAdvertisement(id); load(); } catch {} finally { setDeleting(null); }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Advertisements</h1>
                    <p className="mt-1 text-sm text-slate-500">Schedule advertisements to promote your business.</p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm((v) => !v); }}>
                    {showForm ? "Close" : "+ New advertisement"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 max-w-2xl p-6">
                    <h2 className="font-semibold text-slate-900">{editId ? "Edit advertisement" : "New advertisement"}</h2>
                    {formError && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <Input label="Title" id="title" name="title" value={form.title} onChange={handleChange} required />
                        <div>
                            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                            <Textarea id="description" name="description" rows="3" value={form.description} onChange={handleChange} />
                        </div>
                        <Input label="Image URL (optional)" id="image" name="image" type="url" value={form.image} onChange={handleChange} placeholder="https://..." />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input label="Start date" id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required />
                            <Input label="End date" id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} required />
                        </div>
                        <div className="flex gap-3">
                            <Button type="submit" loading={submitting}>{editId ? "Update" : "Create"}</Button>
                            <Button variant="secondary" type="button" onClick={resetForm}>Cancel</Button>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : ads.length === 0 ? (
                <EmptyState title="No advertisements yet" description="Create your first advertisement to reach more customers." />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Period</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ads.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{ad.title}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {ad.start_date?.slice(0,10)} — {ad.end_date?.slice(0,10)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color={ad.status === "ACTIVE" ? "green" : ad.status === "PENDING" ? "amber" : "gray"}>
                                                {ad.status.toLowerCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(ad.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(ad)}>Edit</Button>
                                                <Button size="sm" variant="danger" loading={deleting === ad.id} onClick={() => handleDelete(ad.id)}>Delete</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default Advertisements;