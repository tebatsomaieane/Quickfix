import { useEffect, useState } from "react";
import {
    fetchMyPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
} from "../../services/businessService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";


function Promotions() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", discount: "", start_date: "", end_date: "" });
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        fetchMyPromotions()
            .then((data) => setPromotions(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const resetForm = () => {
        setForm({ title: "", description: "", discount: "", start_date: "", end_date: "" });
        setEditId(null);
        setShowForm(false);
        setFormError("");
    };

    const handleEdit = (promo) => {
        setForm({
            title: promo.title,
            description: promo.description || "",
            discount: String(promo.discount),
            start_date: promo.start_date?.slice(0, 10) || "",
            end_date: promo.end_date?.slice(0, 10) || ""
        });
        setEditId(promo.id);
        setShowForm(true);
        setFormError("");
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!form.title.trim()) { setFormError("Title is required."); return; }
        if (!form.discount || Number(form.discount) < 0 || Number(form.discount) > 100) { setFormError("Discount must be 0–100."); return; }
        if (!form.start_date) { setFormError("Start date is required."); return; }
        if (!form.end_date) { setFormError("End date is required."); return; }

        setSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || null,
                discount: Number(form.discount),
                start_date: form.start_date,
                end_date: form.end_date
            };

            if (editId) {
                await updatePromotion(editId, payload);
            } else {
                await createPromotion(payload);
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
        try { await deletePromotion(id); load(); } catch {} finally { setDeleting(null); }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
                    <p className="mt-1 text-sm text-slate-500">Create time-limited promotions to attract customers.</p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm((v) => !v); }}>
                    {showForm ? "Close" : "+ New promotion"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 max-w-2xl p-6">
                    <h2 className="font-semibold text-slate-900">{editId ? "Edit promotion" : "New promotion"}</h2>
                    {formError && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <Input label="Title" id="title" name="title" value={form.title} onChange={handleChange} required />
                        <div>
                            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                            <Textarea id="description" name="description" rows="3" value={form.description} onChange={handleChange} />
                        </div>
                        <Input label="Discount %" id="discount" name="discount" type="number" min="0" max="100" step="0.01" value={form.discount} onChange={handleChange} required />
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
            ) : promotions.length === 0 ? (
                <EmptyState title="No promotions yet" description="Create a promotion to offer a time-limited discount to customers." />
            ) : (
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Discount</th>
                                    <th className="px-4 py-3">Period</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {promotions.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{promo.title}</td>
                                        <td className="px-4 py-3 text-indigo-600 font-semibold">{promo.discount}%</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">
                                            {promo.start_date?.slice(0,10)} — {promo.end_date?.slice(0,10)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge color={promo.status === "ACTIVE" ? "green" : promo.status === "PENDING" ? "amber" : "gray"}>
                                                {promo.status.toLowerCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="secondary" onClick={() => handleEdit(promo)}>Edit</Button>
                                                <Button size="sm" variant="danger" loading={deleting === promo.id} onClick={() => handleDelete(promo.id)}>Delete</Button>
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

export default Promotions;