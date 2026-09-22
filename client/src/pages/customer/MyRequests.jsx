import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyRequests } from "../../services/requestService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import {
    formatCurrency,
    formatDate,
    statusColor,
    statusLabel
} from "../../lib/format";

const FILTERS = [
    { key: "ALL", label: "All" },
    { key: "OPEN", label: "Open" },
    { key: "OFFERS_RECEIVED", label: "Offers received" },
    { key: "IN_PROGRESS", label: "In progress" },
    { key: "COMPLETED", label: "Completed" }
];

function MyRequests() {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchMyRequests();

                if (!cancelled) {
                    setRequests(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load your requests. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const filtered =
        filter === "ALL"
            ? requests
            : requests.filter((request) => request.status === filter);

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        My Requests
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Track your service requests and the offers you receive.
                    </p>
                </div>
                <Link to="/customer/requests/new">
                    <Button>
                        <Icon name="plus" className="h-4 w-4" />
                        New request
                    </Button>
                </Link>
            </div>

            {/* Status filters */}
            <div className="mb-6 flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setFilter(item.key)}
                        className={[
                            "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                            filter === item.key
                                ? "bg-indigo-600 text-white"
                                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        ].join(" ")}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState
                    title="Could not load requests"
                    description={error}
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    title="No requests here"
                    description="Create a service request to start receiving offers."
                    icon="briefcase"
                    tone="indigo"
                    action={
                        <Link to="/customer/requests/new">
                            <Button>Create a request</Button>
                        </Link>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {filtered.map((request) => (
                        <Link key={request.id} to={`/customer/requests/${request.id}`}>
                            <Card className="flex flex-col gap-3 p-4 transition hover:border-indigo-300 hover:shadow sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                                        {request.title}
                                    </h3>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        {request.service_name} ·{" "}
                                        {request.category_name} ·{" "}
                                        {request.location}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    {request.offers_count > 0 && (
                                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700">
                                            {request.offers_count} offer
                                            {request.offers_count > 1 ? "s" : ""}
                                        </span>
                                    )}
                                    <span className="text-slate-600">
                                        {formatCurrency(request.budget_min)}
                                        {request.budget_max
                                            ? ` - ${formatCurrency(request.budget_max)}`
                                            : "+"}
                                    </span>
                                    <Badge color={statusColor(request.status)}>
                                        {statusLabel(request.status)}
                                    </Badge>
                                    <span className="text-slate-400">
                                        {formatDate(request.created_at)}
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyRequests;