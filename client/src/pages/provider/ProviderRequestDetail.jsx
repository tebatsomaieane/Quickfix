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

const toDatetimeLocal = (value) =>
    value ? String(value).slice(0, 16) : "";

function ProviderRequestDetail() {
    const { id } = useParams();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        price: "",
        estimated_hours: "",
        message: "",
        valid_until: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [withdrawing, setWithdrawing] = useState(false);

    const load = () => {
        setLoading(true);
        setError("");

        fetchAvailableRequest(id)
            .then((data) => {
                setRequest(data.data);
                setForm({
                    price: data.data.my_offer?.price ?? "",
                    estimated_hours:
                        data.data.my_offer?.estimated_hours ?? "",
                    message: data.data.my_offer?.message ?? "",
                    valid_until: toDatetimeLocal(
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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        const payload = {
            price: form.price,
            estimated_hours: form.estimated_hours || undefined,
            message: form.message || undefined,
            valid_until: form.valid_until || undefined
        };

        try {
            if (request.my_offer) {
                await updateOffer(request.my_offer.id, payload);
            } else {
                await createOffer({ ...payload, request_id: id });
            }

            load();
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                    "Offer could not be submitted."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!window.confirm("Withdraw this offer?")) {
            return;
        }

        setWithdrawing(true);
        setFormError("");

        try {
            await withdrawOffer(request.my_offer.id);
            load();
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                    "Offer could not be withdrawn."
            );
        } finally {
            setWithdrawing(false);
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
                    <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                        {formError}
                    </p>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-5 space-y-4"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Price (M)"
                            id="price"
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 750"
                            value={form.price}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Estimated time (hours)"
                            id="estimated_hours"
                            name="estimated_hours"
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="e.g. 2"
                            value={form.estimated_hours}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="valid_until"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Offer valid until
                        </label>
                        <input
                            id="valid_until"
                            name="valid_until"
                            type="datetime-local"
                            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            value={form.valid_until}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="message"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Message (optional)
                        </label>
                        <Textarea
                            id="message"
                            name="message"
                            rows="3"
                            placeholder="Share your approach and why you are a good fit..."
                            value={form.message}
                            onChange={handleChange}
                        />
                    </div>

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
                                loading={withdrawing}
                            >
                                Withdraw offer
                            </Button>
                        )}
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default ProviderRequestDetail;