import { useEffect, useState } from "react";
import { fetchComplaints, updateComplaint } from "../../services/adminService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/format";

const STATUS_COLORS = {
    OPEN: "amber",
    UNDER_REVIEW: "blue",
    RESOLVED: "green",
    REJECTED: "red"
};

const STATUS_OPTIONS = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState("OPEN");
    const [edits, setEdits] = useState({});
    const [savingId, setSavingId] = useState(null);

    const load = () => {
        setLoading(true);
        setError("");

        fetchComplaints()
            .then((data) => setComplaints(data.data))
            .catch(() =>
                setError("Unable to load complaints. Please try again.")
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = complaints.filter(
        (complaint) => filter === "ALL" || complaint.status === filter
    );

    const handleEdit = (id, field, value) => {
        setEdits((prev) => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleSave = async (complaint) => {
        const edit = edits[complaint.id] || {};

        if (!edit.status && !edit.admin_response) {
            return;
        }

        setSavingId(complaint.id);

        try {
            await updateComplaint(complaint.id, {
                status: edit.status || undefined,
                admin_response: edit.admin_response || undefined
            });

            setEdits((prev) => {
                const next = { ...prev };
                delete next[complaint.id];

                return next;
            });
            load();
        } catch {
            // ignore - user will retry
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Complaints
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Review and resolve complaints from customers and
                        providers.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].map(
                        (status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => setFilter(status)}
                                className={[
                                    "rounded-full px-3 py-1 text-xs font-medium transition",
                                    filter === status
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                ].join(" ")}
                            >
                                {status === "ALL"
                                    ? "All"
                                    : status.toLowerCase().replace("_", " ")}
                            </button>
                        )
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState
                    title="Something went wrong"
                    description={error}
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="No complaints"
                    description={`No complaints with status ${
                        filter === "ALL" ? "" : "'" + filter.toLowerCase().replace("_", " ") + "'"
                    } right now.`}
                />
            ) : (
                <div className="space-y-4">
                    {filtered.map((complaint) => {
                        const edit = edits[complaint.id] || {};
                        const dirty =
                            edit.status || edit.admin_response !== undefined;

                        return (
                            <Card key={complaint.id} className="p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-slate-900">
                                                {complaint.subject}
                                            </h3>
                                            <Badge
                                                color={
                                                    STATUS_COLORS[
                                                        complaint.status
                                                    ] || "gray"
                                                }
                                            >
                                                {complaint.status
                                                    .toLowerCase()
                                                    .replace("_", " ")}
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {complaint.first_name}{" "}
                                            {complaint.last_name} (
                                            {complaint.role
                                                .toLowerCase()
                                                .replace("_", " ")}
                                            ) ·{" "}
                                            {complaint.job_id
                                                ? `Job #${complaint.job_id} · `
                                                : ""}
                                            {formatDate(
                                                complaint.created_at
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-sm text-slate-700">
                                    {complaint.description}
                                </p>

                                {complaint.admin_response && (
                                    <div className="mt-3 rounded-lg bg-slate-50 p-4">
                                        <p className="text-sm font-medium text-slate-700">
                                            Admin response
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {complaint.admin_response}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr_auto]">
                                    <select
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                        value={edit.status || complaint.status}
                                        onChange={(e) =>
                                            handleEdit(
                                                complaint.id,
                                                "status",
                                                e.target.value
                                            )
                                        }
                                        aria-label="Status"
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option
                                                    .toLowerCase()
                                                    .replace("_", " ")}
                                            </option>
                                        ))}
                                    </select>

                                    <textarea
                                        rows="2"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                        placeholder="Add an admin response..."
                                        value={
                                            edit.admin_response ??
                                            complaint.admin_response ??
                                            ""
                                        }
                                        onChange={(e) =>
                                            handleEdit(
                                                complaint.id,
                                                "admin_response",
                                                e.target.value
                                            )
                                        }
                                    />

                                    <Button
                                        size="sm"
                                        disabled={!dirty}
                                        loading={savingId === complaint.id}
                                        onClick={() => handleSave(complaint)}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AdminComplaints;