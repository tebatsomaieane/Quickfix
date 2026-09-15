import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelRequest, fetchRequest } from "../../services/requestService";
import { acceptOffer } from "../../services/offerService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import ProviderAvatar from "../../components/ui/ProviderAvatar";
import VerificationBadge from "../../components/ui/VerificationBadge";
import {
    formatCurrency,
    formatDate,
    statusColor,
    statusLabel
} from "../../lib/format";

function RequestDetail() {
    const { id } = useParams();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [acceptingId, setAcceptingId] = useState(null);
    const [actionError, setActionError] = useState("");
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchRequest(id);

                if (!cancelled) {
                    setRequest(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError("Unable to load this request.");
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
    }, [id]);

    const canAccept =
        request &&
        ["OPEN", "OFFERS_RECEIVED"].includes(request.status);

    const canCancel =
        request &&
        ["OPEN", "OFFERS_RECEIVED"].includes(request.status);

    const handleAccept = async (offerId) => {
        setActionError("");
        setAcceptingId(offerId);

        try {
            const data = await acceptOffer(offerId);

            if (data.success) {
                const fresh = await fetchRequest(id);
                setRequest(fresh.data);
            }
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Failed to accept offer."
            );
        } finally {
            setAcceptingId(null);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Cancel this request? Providers will be notified.")) {
            return;
        }

        setActionError("");
        setCancelling(true);

        try {
            const data = await cancelRequest(id);

            if (data.success) {
                const fresh = await fetchRequest(id);
                setRequest(fresh.data);
            }
        } catch (err) {
            setActionError(
                err.response?.data?.message ||
                "Request could not be cancelled."
            );
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner />
            </div>
        );
    }

    if (error || !request) {
        return (
            <EmptyState
                title="Request not found"
                description={error}
                action={
                    <Link to="/customer/requests">
                        <Button variant="outline">Back to my requests</Button>
                    </Link>
                }
            />
        );
    }

    const acceptedJob = request.jobs?.[0];
    const acceptedOffer = request.offers?.find(
        (offer) => offer.status === "ACCEPTED"
    );

    return (
        <div>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Link
                        to="/customer/requests"
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        <Icon name="chevronRight" className="h-4 w-4 rotate-180" />
                        Back to requests
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">
                        {request.title}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {request.service_name} · {request.category_name}
                    </p>
                </div>
                <Badge color={statusColor(request.status)} className="w-fit">
                    {statusLabel(request.status)}
                </Badge>

                {canCancel && (
                    <Button
                        variant="danger"
                        onClick={handleCancel}
                        loading={cancelling}
                    >
                        Cancel request
                    </Button>
                )}
            </div>

            {actionError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {/* Request details */}
            <Card className="p-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">
                            Description
                        </dt>
                        <dd className="mt-1 text-slate-700">
                            {request.description}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Location
                        </dt>
                        <dd className="mt-1 text-slate-700">
                            {request.location}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Budget
                        </dt>
                        <dd className="mt-1 text-slate-700">
                            {formatCurrency(request.budget_min)}
                            {request.budget_max
                                ? ` - ${formatCurrency(request.budget_max)}`
                                : "+"}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Preferred date
                        </dt>
                        <dd className="mt-1 text-slate-700">
                            {request.preferred_date
                                ? formatDate(request.preferred_date)
                                : "Not specified"}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-sm font-medium text-slate-500">
                            Preferred time
                        </dt>
                        <dd className="mt-1 text-slate-700">
                            {request.preferred_time || "Not specified"}
                        </dd>
                    </div>
                </dl>

                {request.attachments?.length > 0 && (
                    <div className="mt-6">
                        <p className="text-sm font-medium text-slate-500">
                            Photos & videos
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {request.attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="overflow-hidden rounded-lg border border-slate-200"
                                >
                                    {String(
                                        attachment.file_type || ""
                                    ).startsWith("video/") ? (
                                        <video
                                            src={attachment.file_url}
                                            controls
                                            className="h-32 w-full bg-black object-contain"
                                        />
                                    ) : (
                                        <img
                                            src={attachment.file_url}
                                            alt={attachment.file_name}
                                            className="h-32 w-full object-cover"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Accepted job */}
            {acceptedOffer && acceptedJob && (
                <Card className="mt-6 border-green-200 bg-green-50/50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Provider selected
                            </h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Job #{acceptedJob.id} is{" "}
                                <span className="font-medium capitalize">
                                    {statusLabel(acceptedJob.status)}
                                </span>
                                .
                            </p>
                        </div>
                        <Badge color="green">
                            Job #{acceptedJob.id}
                        </Badge>
                    </div>
                </Card>
            )}

            {/* Offers */}
            <div className="mt-6">
                <h2 className="mb-4 font-semibold text-slate-900">
                    Offers ({request.offers.length})
                </h2>

                {request.offers.length === 0 ? (
                    <EmptyState
                        title="No offers yet"
                        description="Once providers send offers, they will appear here for you to compare."
                    />
                ) : (
                    <div className="space-y-4">
                        {request.offers.map((offer) => (
                            <Card
                                key={offer.id}
                                className={
                                    offer.status === "ACCEPTED"
                                        ? "border-green-300 p-5"
                                        : "p-5"
                                }
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <ProviderAvatar
                                            name={`${offer.first_name} ${offer.last_name}`}
                                            image={offer.profile_image}
                                        />
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">
                                                    {offer.first_name}{" "}
                                                    {offer.last_name}
                                                </h3>
                                                <VerificationBadge
                                                    verified={
                                                        offer.verification_status ===
                                                        "APPROVED"
                                                    }
                                                />
                                                <Badge
                                                    color={statusColor(
                                                        offer.status
                                                    )}
                                                >
                                                    {statusLabel(offer.status)}
                                                </Badge>
                                            </div>
                                            <p className="mt-0.5 text-sm text-slate-500">
                                                {offer.location}
                                            </p>
                                            {offer.message && (
                                                <p className="mt-2 max-w-xl text-sm text-slate-600">
                                                    {offer.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 sm:text-right">
                                        <p className="text-xl font-bold text-slate-900">
                                            {formatCurrency(offer.price)}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Est. {offer.estimated_hours}h
                                        </p>

                                        {offer.status === "PENDING" &&
                                            canAccept && (
                                                <Button
                                                    size="sm"
                                                    className="mt-3"
                                                    loading={
                                                        acceptingId ===
                                                        offer.id
                                                    }
                                                    onClick={() =>
                                                        handleAccept(
                                                            offer.id
                                                        )
                                                    }
                                                >
                                                    Accept offer
                                                </Button>
                                            )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RequestDetail;