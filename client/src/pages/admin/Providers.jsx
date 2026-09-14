import { useEffect, useState } from "react";
import { fetchAdminProviders } from "../../services/adminService";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/format";

const VERIFICATION_COLORS = {
    APPROVED: "green",
    PENDING: "amber",
    REJECTED: "red"
};

function AdminProviders() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const load = (params = {}) => {
        setLoading(true);
        fetchAdminProviders(params)
            .then((data) => setProviders(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const filtered = providers.filter(
        (p) => filter === "ALL" || p.verification_status === filter
    );

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        All registered service providers.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {["ALL", "APPROVED", "PENDING", "REJECTED"].map((s) => (
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
                <EmptyState title="No providers" description="No providers match the selected filter." />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filtered.map((provider) => (
                        <Card key={provider.id} className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">
                                            {provider.first_name} {provider.last_name}
                                        </h3>
                                        <Badge color={VERIFICATION_COLORS[provider.verification_status] || "gray"}>
                                            {provider.verification_status.toLowerCase()}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {provider.email} · {provider.phone || "No phone"}
                                    </p>
                                </div>
                                <Badge color={provider.is_active ? "green" : "red"}>
                                    {provider.is_active ? "active" : "disabled"}
                                </Badge>
                            </div>

                            <p className="mt-3 text-sm text-slate-600">
                                {provider.description || "No description provided."}
                            </p>

                            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                                <div>
                                    <span className="text-xs text-slate-400">Location</span>
                                    <p className="font-medium text-slate-800">{provider.location || "—"}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Experience</span>
                                    <p className="font-medium text-slate-800">{provider.experience_years || 0} yrs</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">Completed jobs</span>
                                    <p className="font-medium text-slate-800">{provider.completed_jobs || 0}</p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <div className="text-sm">
                                    <span className="text-amber-500">★</span>{" "}
                                    <span className="font-semibold text-slate-900">
                                        {provider.rating ? Number(provider.rating).toFixed(1) : "—"}
                                    </span>
                                    <span className="text-xs text-slate-400"> ({provider.review_count || 0} reviews)</span>
                                </div>
                                <Link to={`/admin/providers/${provider.id}`} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="secondary">View profile</Button>
                                </Link>
                            </div>

                            <p className="mt-2 text-xs text-slate-400">Joined {formatDate(provider.created_at)}</p>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminProviders;