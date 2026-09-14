import { useEffect, useState } from "react";
import {
    fetchBusinesses,
    reviewBusinessVerification
} from "../../services/adminService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/format";

const STATUS_COLORS = {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "red"
};

function AdminBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [savingId, setSavingId] = useState(null);

    const load = () => {
        setLoading(true);
        fetchBusinesses()
            .then((data) => setBusinesses(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const filtered = businesses.filter(
        (b) => filter === "ALL" || b.verification_status === filter
    );

    const handleDecision = async (business, status) => {
        setSavingId(business.id);
        try {
            await reviewBusinessVerification(business.id, { verification_status: status });
            load();
        } catch {} finally {
            setSavingId(null);
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Businesses</h1>
                    <p className="mt-1 text-sm text-slate-500">Review and verify registered businesses.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setFilter(s)}
                            className={[
                                "rounded-full px-3 py-1 text-xs font-medium transition",
                                filter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            ].join(" ")}
                        >
                            {s === "ALL" ? "All" : s.toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : filtered.length === 0 ? (
                <EmptyState title="No businesses" description="No businesses match the selected filter." />
            ) : (
                <div className="space-y-4">
                    {filtered.map((biz) => (
                        <Card key={biz.id} className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">{biz.name}</h3>
                                        <Badge color={STATUS_COLORS[biz.verification_status] || "gray"}>
                                            {biz.verification_status.toLowerCase()}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        Owner: {biz.first_name} {biz.last_name} ({biz.owner_email}) · {biz.location || "No location"} · {formatDate(biz.created_at)}
                                    </p>
                                </div>
                            </div>

                            {biz.description && (
                                <p className="mt-2 text-sm text-slate-600">{biz.description}</p>
                            )}

                            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                                <div><span className="text-slate-500">Phone</span><p className="text-slate-900">{biz.phone || "—"}</p></div>
                                <div><span className="text-slate-500">Email</span><p className="text-slate-900">{biz.email || "—"}</p></div>
                                <div><span className="text-slate-500">Hours</span><p className="text-slate-900">{biz.operating_hours || "—"}</p></div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    disabled={biz.verification_status === "APPROVED"}
                                    loading={savingId === biz.id}
                                    onClick={() => handleDecision(biz, "APPROVED")}
                                >
                                    Approve
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    disabled={biz.verification_status === "REJECTED"}
                                    loading={savingId === biz.id}
                                    onClick={() => handleDecision(biz, "REJECTED")}
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

export default AdminBusinesses;