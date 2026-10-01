import { useCallback, useEffect, useState } from "react";
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
import SmartImage from "../../components/ui/SmartImage";
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";
import { formatDate } from "../../lib/format";

const EMPTY_FORM = {
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    image: ""
};

/**
 * Mirrors `content.advertisement` on the server.
 *
 * The date range is the rule that matters: an advertisement whose end date
 * precedes its start is stored happily by MySQL and then simply never runs.
 * `afterOrEqual` compares the two as plain calendar strings, which is exact for
 * `YYYY-MM-DD` and immune to timezone shifting a day.
 */
const SCHEMA = {
    title: [
        rules.required("Title"),
        rules.minLength(3, "Title must be at least 3 characters"),
        rules.maxLength(200, "Title must be 200 characters or fewer")
    ],
    description: [
        rules.maxLength(5000, "Description must be 5000 characters or fewer")
    ],
    image: [rules.maxLength(500, "Image URL is too long")],
    start_date: [rules.required("Start date")],
    end_date: [
        rules.required("End date"),
        rules.afterOrEqual("start_date", "End date")
    ]
};

function Advertisements() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const {
        values: form,
        fieldErrors,
        formError,
        announcement,
        pending: submitting,
        handleChange,
        handleBlur,
        validateAll,
        reset,
        run
    } = useActionFeedback({ schema: SCHEMA, initialValues: EMPTY_FORM });

    const { run: runDelete } = useActionFeedback();

    const load = useCallback(() => {
        setLoading(true);
        fetchMyAdvertisements()
            .then((data) => setAds(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const closeForm = () => {
        reset(EMPTY_FORM);
        setEditId(null);
        setShowForm(false);
    };

    const toggleForm = () => {
        if (showForm) {
            closeForm();

            return;
        }

        reset(EMPTY_FORM);
        setEditId(null);
        setShowForm(true);
    };

    const handleEdit = (ad) => {
        reset({
            title: ad.title,
            description: ad.description || "",
            start_date: ad.start_date?.slice(0, 10) || "",
            end_date: ad.end_date?.slice(0, 10) || "",
            image: ad.image || ""
        });
        setEditId(ad.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAll(form)) {
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            image: form.image.trim() || null,
            start_date: form.start_date,
            end_date: form.end_date
        };

        const { ok } = await run(
            () =>
                editId
                    ? updateAdvertisement(editId, payload)
                    : createAdvertisement(payload),
            {
                success: editId
                    ? "Advertisement updated."
                    : "Advertisement created.",
                retry: true
            }
        );

        if (ok) {
            closeForm();
            load();
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);

        const { ok } = await runDelete(() => deleteAdvertisement(id), {
            success: "Advertisement deleted.",
            retry: true
        });

        if (ok) {
            load();
        }

        setDeleting(null);
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Advertisements</h1>
                    <p className="mt-1 text-sm text-slate-500">Schedule advertisements to promote your business.</p>
                </div>
                <Button onClick={toggleForm}>
                    {showForm ? "Close" : "+ New advertisement"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 max-w-2xl p-6">
                    <h2 className="font-semibold text-slate-900">{editId ? "Edit advertisement" : "New advertisement"}</h2>
                    {formError && <div role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
                    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                        <Input
                            label="Title"
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={200}
                            error={fieldErrors.title}
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

                        <Input
                            label="Image URL (optional)"
                            id="image"
                            name="image"
                            type="url"
                            value={form.image}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={500}
                            error={fieldErrors.image}
                            placeholder="https://..."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Start date"
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={form.start_date}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={fieldErrors.start_date}
                                required
                            />
                            <Input
                                label="End date"
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={form.end_date}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                // A date picker only allows a past date once a
                                // start has been chosen, so the range cannot be
                                // built backwards by accident.
                                min={form.start_date || undefined}
                                error={fieldErrors.end_date}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button type="submit" loading={submitting}>{editId ? "Update" : "Create"}</Button>
                            <Button variant="secondary" type="button" onClick={closeForm}>Cancel</Button>
                        </div>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : ads.length === 0 ? (
                <EmptyState title="No advertisements yet" description="Create your first advertisement to reach more customers." />
            ) : (
                <>
                    <Card className="hidden overflow-hidden md:block">
                        <div className="qf-scroll-x overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wide text-slate-500">
                                    <tr>
                                <th className="px-4 py-3">Advertisement</th>
                                <th className="px-4 py-3">Period</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Created</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ads.map((ad) => (
                                    <tr key={ad.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <SmartImage
                                                    src={ad.image}
                                                    alt={ad.title}
                                                    seed={ad.title}
                                                    icon="megaphone"
                                                    className="h-11 w-11 shrink-0 rounded-xl object-cover"
                                                />
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium text-slate-900">
                                                        {ad.title}
                                                    </span>
                                                    {ad.description && (
                                                        <span className="block truncate text-xs text-slate-500">
                                                            {ad.description}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
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

                    <div className="space-y-3 md:hidden">
                        {ads.map((ad) => (
                            <Card key={ad.id} className="overflow-hidden p-0">
                                <SmartImage
                                    src={ad.image}
                                    alt={ad.title}
                                    seed={ad.title}
                                    icon="megaphone"
                                    className="h-36 w-full object-cover"
                                />
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="min-w-0 font-semibold leading-snug text-slate-900">
                                            {ad.title}
                                        </h3>
                                        <Badge color={ad.status === "ACTIVE" ? "green" : ad.status === "PENDING" ? "amber" : "gray"}>
                                            {ad.status.toLowerCase()}
                                        </Badge>
                                    </div>
                                    {ad.description && (
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                            {ad.description}
                                        </p>
                                    )}
                                    <p className="mt-2 text-xs text-slate-400">
                                        {ad.start_date?.slice(0, 10)} — {ad.end_date?.slice(0, 10)}
                                        {" · "}Created {formatDate(ad.created_at)}
                                    </p>
                                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                                        <Button
                                            size="md"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={() => handleEdit(ad)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="md"
                                            variant="danger"
                                            className="flex-1"
                                            loading={deleting === ad.id}
                                            onClick={() => handleDelete(ad.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default Advertisements;