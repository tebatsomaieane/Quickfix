import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAvailableRequests } from "../../services/requestService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { formatCurrency, formatDate } from "../../lib/format";

function AvailableRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("ALL");
    const [onlyMatches, setOnlyMatches] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");

            try {
                const data = await fetchAvailableRequests();

                if (!cancelled) {
                    setRequests(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load requests. Please try again later."
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

    const categories = useMemo(
        () =>
            [...new Set(requests.map((r) => r.category_name).filter(Boolean))]
                .sort(),
        [requests]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        const matches = requests.filter((request) => {
            if (onlyMatches && !request.matches_skills) {
                return false;
            }

            if (category !== "ALL" && request.category_name !== category) {
                return false;
            }

            if (!q) {
                return true;
            }

            return [request.title, request.service_name, request.location]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(q));
        });

        // Fresh opportunities first, offers already made drop below
        return [...matches].sort(
            (a, b) =>
                Number(Boolean(b.matches_skills)) -
                    Number(Boolean(a.matches_skills)) ||
                Number(Boolean(a.has_pending_offer)) -
                    Number(Boolean(b.has_pending_offer))
        );
    }, [requests, search, category, onlyMatches]);

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Requests for service
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Open requests from customers. Review the details and
                        submit an offer.
                    </p>
                </div>
                <Link
                    to="/provider/offers"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    View my offers
                </Link>
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
            ) : requests.length === 0 ? (
                <EmptyState
                    title="No open requests"
                    description="There are no requests accepting offers right now. Check back soon."
                />
            ) : (
                <div>
                    {/* Filter toolbar */}
                    <Card className="mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                        <div className="flex-1">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, service or location..."
                                aria-label="Search requests"
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={onlyMatches}
                                    onChange={(e) =>
                                        setOnlyMatches(e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                My services only
                            </label>

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                aria-label="Filter by category"
                            >
                                <option value="ALL">All categories</option>
                                {categories.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {filtered.length} of {requests.length}
                            </span>
                        </div>
                    </Card>

                    {filtered.length === 0 ? (
                        <EmptyState
                            title="No matching requests"
                            description="Adjust your search or filters to see more opportunities."
                        />
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((request) => (
                                <Link
                                    key={request.id}
                                    to={`/provider/requests/${request.id}`}
                                >
                                    <Card className="p-5 transition hover:border-indigo-300 hover:shadow">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                                                        {request.title}
                                                    </h3>
                                                    {request.matches_skills && (
                                                        <Badge color="green">
                                                            Matches your services
                                                        </Badge>
                                                    )}
                                                    {request.has_pending_offer && (
                                                        <Badge color="amber">
                                                            Offer submitted
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-sm text-slate-500">
                                                    {request.service_name}{" "}
                                                    · {request.category_name}{" "}
                                                    · {request.location}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                                <span className="text-slate-600">
                                                    {formatCurrency(
                                                        request.budget_min
                                                    )}
                                                    {request.budget_max
                                                        ? ` - ${formatCurrency(
                                                              request.budget_max
                                                          )}`
                                                        : "+"}
                                                </span>
                                                {request.preferred_date && (
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <Icon
                                                            name="calendar"
                                                            className="h-4 w-4"
                                                        />
                                                        {formatDate(
                                                            request.preferred_date
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AvailableRequests;