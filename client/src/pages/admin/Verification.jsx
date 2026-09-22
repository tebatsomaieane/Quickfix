import { useEffect, useState } from "react";
import {
    fetchVerification,
    reviewVerification
} from "../../services/adminService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import SmartImage from "../../components/ui/SmartImage";
import { formatDate } from "../../lib/format";

const STATUS_COLORS = {
    PENDING: "amber",
    UNDER_REVIEW: "blue",
    APPROVED: "green",
    REJECTED: "red"
};

function AdminVerification() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [filter, setFilter] = useState("PENDING");
    const [notes, setNotes] = useState({});
    const [saving, setSaving] = useState({});

    const load = () => {
        setLoading(true);
        setError("");

        fetchVerification()
            .then((data) => setRequests(data.data))
            .catch(() =>
                setError("Unable to load verification requests.")
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = requests.filter(
        (request) => filter === "ALL" || request.status === filter
    );

    const handleDecision = async (request, status) => {
        setSaving((prev) => ({ ...prev, [request.id]: status }));

        try {
            await reviewVerification(request.id, {
                status,
                admin_notes: notes[request.id]?.trim() || undefined
            });
            setNotes((prev) => {
                const next = { ...prev };
                delete next[request.id];

                return next;
            });
            load();
        } catch {
            // ignore - user will retry
        } finally {
            setSaving((prev) => {
                const next = { ...prev };
                delete next[request.id];

                return next;
            });
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Provider verification
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Review provider identities, qualifications and
                        supporting documents.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].map(
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
                    title="No verification requests"
                    description="New provider verification requests will appear here."
                />
            ) : (
                <div className="space-y-4">
                    {filtered.map((request) => (
                        <Card key={request.id} className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">
                                            {request.first_name}{" "}
                                            {request.last_name}
                                        </h3>
                                        <Badge
                                            color={
                                                STATUS_COLORS[request.status] ||
                                                "gray"
                                            }
                                        >
                                            {request.status
                                                .toLowerCase()
                                                .replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {request.email} · {request.phone} ·{" "}
                                        {request.location} ·{" "}
                                        {formatDate(request.created_at)}
                                    </p>
                                </div>

                                {request.document_url && (
                                    <a
                                        href={request.document_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="group relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200"
                                        title="Open document"
                                    >
                                        <SmartImage
                                            src={request.document_url}
                                            alt="Verification document"
                                            seed={`doc-${request.id}`}
                                            icon="file"
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                    </a>
                                )}
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg bg-slate-50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500">
                                        IDENTITY
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {request.identity_information}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500">
                                        PROFESSIONAL
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {request.professional_information}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-slate-50 p-4">
                                    <p className="text-xs font-semibold tracking-wide text-slate-500">
                                        QUALIFICATIONS
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {request.qualification_information}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <textarea
                                    rows="2"
                                    className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    placeholder="Notes for the provider (shown on rejection)..."
                                    value={notes[request.id] ?? ""}
                                    onChange={(e) =>
                                        setNotes((prev) => ({
                                            ...prev,
                                            [request.id]: e.target.value
                                        }))
                                    }
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    loading={saving[request.id] === "UNDER_REVIEW"}
                                    disabled={
                                        request.status === "UNDER_REVIEW"
                                    }
                                    onClick={() =>
                                        handleDecision(request, "UNDER_REVIEW")
                                    }
                                >
                                    Mark in review
                                </Button>
                                <Button
                                    size="sm"
                                    loading={saving[request.id] === "APPROVED"}
                                    onClick={() =>
                                        handleDecision(request, "APPROVED")
                                    }
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    loading={saving[request.id] === "REJECTED"}
                                    onClick={() =>
                                        handleDecision(request, "REJECTED")
                                    }
                                >
                                    Reject
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminVerification;