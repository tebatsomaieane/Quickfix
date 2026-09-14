import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyOffers, withdrawOffer } from "../../services/offerService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatCurrency, formatDate } from "../../lib/format";

const OFFER_COLORS = {
    PENDING: "amber",
    ACCEPTED: "green",
    REJECTED: "red",
    WITHDRAWN: "gray",
    EXPIRED: "gray"
};

function MyOffers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [withdrawing, setWithdrawing] = useState(null);

    const load = () => {
        setLoading(true);
        setError("");

        fetchMyOffers()
            .then((data) => setOffers(data.data))
            .catch(() => setError("Unable to load your offers."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const handleWithdraw = async (offer) => {
        if (!window.confirm("Withdraw this offer? You can still resubmit if the request is open.")) {
            return;
        }

        setWithdrawing(offer.id);

        try {
            await withdrawOffer(offer.id);
            load();
        } catch {
            setError("Offer could not be withdrawn.");
        } finally {
            setWithdrawing(null);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    My offers
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Every offer you have submitted on customer requests.
                </p>
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
            ) : offers.length === 0 ? (
                <EmptyState
                    title="No offers yet"
                    description="Browse open requests and submit an offer to get started."
                    action={
                        <Link to="/provider/requests">
                            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                                Browse requests
                            </button>
                        </Link>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {offers.map((offer) => (
                        <Card key={offer.id} className="p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                                            {offer.request_title}
                                        </h3>
                                        <Badge
                                            color={
                                                OFFER_COLORS[offer.status] ||
                                                "gray"
                                            }
                                        >
                                            {offer.status
                                                .toLowerCase()
                                                .replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        {offer.service_name} ·{" "}
                                        {offer.location} · Posted{" "}
                                        {formatDate(offer.created_at)}
                                    </p>
                                    {offer.message && (
                                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                                            {offer.message}
                                        </p>
                                    )}
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-lg font-bold text-slate-900">
                                        {formatCurrency(offer.price)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Est. {offer.estimated_hours || "..."}h
                                    </p>
                                    {offer.status === "PENDING" && (
                                        <div className="mt-2 flex flex-col items-end gap-2 min-[420px]:flex-row min-[420px]:items-center">
                                            <Link
                                                to={`/provider/requests/${offer.request_id}`}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                View / edit offer
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                loading={withdrawing === offer.id}
                                                onClick={() =>
                                                    handleWithdraw(offer)
                                                }
                                            >
                                                Withdraw
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyOffers;