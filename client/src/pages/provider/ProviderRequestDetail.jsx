import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    fetchAvailableRequest
} from "../../services/requestService";
import {
    createOffer,
    updateOffer,
    withdrawOffer
} from "../../services/offerService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { formatCurrency, formatDate } from "../../lib/format";
import { useActionFeedback } from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";

// A `DATETIME` column read back as "2026-10-05 14:30:00"; the date input wants
// only the leading date part.
const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const INITIAL_VALUES = {
    price: "",
    estimated_hours: "",
    message: "",
    valid_until: ""
};

/**
 * Mirrors `content.createOffer` / `content.updateOffer` on the server.
 *
 * `valid_until` is a plain date rather than a date-and-time. The API validates it
 * as `YYYY-MM-DD`, and a `datetime-local` input produces "2026-10-05T14:30",
 * which that check rejects outright -- so the picker sends the day the offer
 * lapses and the server stores it at midnight.
 */
const SCHEMA = {
    price: [
        rules.required("Your price"),
        rules.number({ label: "Your price", min: 0.01 })
    ],
    estimated_hours: [
        rules.number({ label: "Estimated time", min: 0.5, max: 1000 })
    ],
    valid_until: [rules.notPast("Offer expiry")],
    message: [
        rules.maxLength(1000, "Message must be 1000 characters or fewer")
    ]
};

function ProviderRequestDetail() {
    const { id } = useParams();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Push button calls (submit/update/withdraw) through the shared feedback
    // path: plain-language failures, a retry for network hiccups, and a
    // confirmatory toast. The inline banner below the form only carries a
    // rejection that names no single field, because the schema gives the hook
    // somewhere better to put each validation problem.
    const {
        run,
        pending: submitting,
        formError,
        announcement,
        values: form,
        fieldErrors,
        handleChange,
        handleBlur,
        validateAll,
        reset
    } = useActionFeedback({ schema: SCHEMA, initialValues: INITIAL_VALUES });

    const load = () => {
        setLoading(true);
        setError("");

        fetchAvailableRequest(id)
            .then((data) => {
                setRequest(data.data);
                // Seed the form from the loaded offer through the hook, so the
                // values being validated are the ones actually on screen.
                reset({
                    price: data.data.my_offer?.price ?? "",
                    estimated_hours:
                        data.data.my_offer?.estimated_hours ?? "",
                    message: data.data.my_offer?.message ?? "",
                    valid_until: toDateInput(
                        data.data.my_offer?.valid_until
                    )
                });
            })
            .catch((err) =>
                setError(
                    err.response?.data?.message ||
                        "Unable to load this request."
                )
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // The hook's `handleChange` reads name/value off the event and stores the
    // raw string, so an emptied number input stays "" rather than becoming NaN,
    // which the payload below turns back into "not specified".
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAll(form)) {
            return;
        }

        const payload = {
            price: form.price,
            estimated_hours: form.estimated_hours || undefined,
            message: form.message || undefined,
            valid_until: form.valid_until || undefined
        };

        const { ok } = await run(
            () =>
                request.my_offer
                    ? updateOffer(request.my_offer.id, payload)
                    : createOffer({ ...payload, request_id: id }),
            {
                success: request.my_offer
                    ? "Offer updated."
                    : "Offer submitted.",
                retry: true
            }
        );

        if (ok) {
            load();
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm("Withdraw this offer?")) {
            return;
        }

        const { ok } = await run(
            () => withdrawOffer(request.my_offer.id),
            { success: "Offer withdrawn.", retry: true }
        );

        if (ok) {
            load();
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner />
            </div>
        );
    }

    if (error || !request) {
        return (
            <EmptyState
                title="Request unavailable"
                description={error}
            />
        );
    }

    const isPending = request.my_offer?.status === "PENDING";

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <Link
                    to="/provider/requests"
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

            {/* Offer form */}
            <Card className="mt-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">
                        {request.my_offer
                            ? isPending
                                ? "Your offer"
                                : "Your offer"
                            : "Submit an offer"}
                    </h2>
                    {request.my_offer && (
                        <Badge color={isPending ? "amber" : "gray"}>
                            {request.my_offer.status
                                .toLowerCase()
                                .replace("_", " ")}
                        </Badge>
                    )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                    The customer can compare offers before choosing a
                    provider.
                </p>

                {formError && (
                    <div
                        role="alert"
                        className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {formError}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="mt-5 space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Price (M)"
                            id="price"
                            name="price"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="e.g. 750"
                            value={form.price}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={12}
                            error={fieldErrors.price}
                            required
                        />
                        <Input
                            label="Estimated time (hours)"
                            id="estimated_hours"
                            name="estimated_hours"
                            type="number"
                            min="0.5"
                            step="0.5"
                            placeholder="e.g. 2"
                            value={form.estimated_hours}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            hint="Optional — half-hour steps."
                            error={fieldErrors.estimated_hours}
                        />
                    </div>

                    <Input
                        label="Offer valid until"
                        id="valid_until"
                        name="valid_until"
                        type="date"
                        value={form.valid_until}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        hint="Optional — after this date the customer can no longer accept it."
                        error={fieldErrors.valid_until}
                    />

                    <Textarea
                        label="Message (optional)"
                        id="message"
                        name="message"
                        rows="3"
                        placeholder="Share your approach and why you are a good fit..."
                        value={form.message}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={1000}
                        error={fieldErrors.message}
                    />

                    <div className="flex flex-wrap gap-3 pt-1">
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={request.my_offer && !isPending}
                        >
                            {request.my_offer
                                ? "Update offer"
                                : "Submit offer"}
                        </Button>

                        {request.my_offer && isPending && (
                            <Button
                                variant="danger"
                                onClick={handleWithdraw}
                                loading={submitting}
                            >
                                Withdraw offer
                            </Button>
                        )}
                    </div>

                    <p aria-live="polite" className="sr-only">
                        {announcement}
                    </p>
                </form>
            </Card>
        </div>
    );
}

export default ProviderRequestDetail;