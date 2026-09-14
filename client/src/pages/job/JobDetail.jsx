import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    completeJob,
    fetchJob,
    startJob
} from "../../services/jobService";
import { createOrFindConversation } from "../../services/conversationService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import {
    formatCurrency,
    formatDateTime,
    statusColor,
    statusLabel
} from "../../lib/format";

function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [messaging, setMessaging] = useState(false);

    const isProvider = user?.role === "PROVIDER";

    const load = () => {
        setLoading(true);
        setError("");

        fetchJob(id)
            .then((data) => setJob(data.data))
            .catch(() =>
                setError("Unable to load this job.")
            )
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleStart = async () => {
        setBusy(true);

        try {
            await startJob(job.id);
            load();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Job could not be started."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleComplete = async () => {
        setBusy(true);

        try {
            await completeJob(job.id);
            load();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Job could not be completed."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleMessage = async () => {
        setMessaging(true);

        try {
            const data = await createOrFindConversation(job.request_id);

            const threadBase = isProvider
                ? "/provider/messages"
                : "/customer/messages";

            navigate(`${threadBase}/${data.data.conversation.id}`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not open the conversation."
            );
        } finally {
            setMessaging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Spinner />
            </div>
        );
    }

    if (error || !job) {
        return (
            <EmptyState
                title="Job not found"
                description={error}
                action={
                    <Button variant="outline">
                        <Link
                            to={
                                isProvider
                                    ? "/provider/jobs"
                                    : "/customer/jobs"
                            }
                        >
                            Back to jobs
                        </Link>
                    </Button>
                }
            />
        );
    }

    const canStart = isProvider && job.status === "ASSIGNED";
    const canComplete = isProvider && job.status === "IN_PROGRESS";
    const canReview =
        !isProvider &&
        job.status === "COMPLETED" &&
        !job.review;
    const canMessage =
        job.status === "ASSIGNED" ||
        job.status === "IN_PROGRESS" ||
        job.status === "COMPLETED";

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {job.request_title}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {job.service_name} · {job.request_location}
                    </p>
                </div>
                <Badge color={statusColor(job.status)}>
                    {statusLabel(job.status)}
                </Badge>
            </div>

            {/* Actions */}
            {(canStart || canComplete || canReview || canMessage) && (
                <div className="mb-6 flex flex-wrap gap-3">
                    {canStart && (
                        <Button onClick={handleStart} loading={busy}>
                            <Icon name="checkCircle" className="h-4 w-4" />
                            Start job
                        </Button>
                    )}
                    {canComplete && (
                        <Button onClick={handleComplete} loading={busy}>
                            <Icon name="checkCircle" className="h-4 w-4" />
                            Mark as complete
                        </Button>
                    )}
                    {canReview && (
                        <Link to={`/customer/review/${job.id}`}>
                            <Button>
                                <Icon name="star" className="h-4 w-4" />
                                Leave a review
                            </Button>
                        </Link>
                    )}
                    {canMessage && (
                        <Button
                            variant="outline"
                            onClick={handleMessage}
                            loading={messaging}
                        >
                            <Icon name="chat" className="h-4 w-4" />
                            {isProvider ? "Message customer" : "Message provider"}
                        </Button>
                    )}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Job details */}
                <Card className="p-6 lg:col-span-2">
                    <h2 className="font-semibold text-slate-900">
                        Job details
                    </h2>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Provider
                            </dt>
                            <dd className="mt-1 font-medium text-slate-900">
                                {job.provider_first_name} {job.provider_last_name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Customer
                            </dt>
                            <dd className="mt-1 font-medium text-slate-900">
                                {job.customer_first_name} {job.customer_last_name}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Agreed price
                            </dt>
                            <dd className="mt-1 font-semibold text-slate-900">
                                {formatCurrency(job.offer_price)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Location
                            </dt>
                            <dd className="mt-1 text-slate-700">
                                {job.request_location}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Created
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {formatDateTime(job.created_at)}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Started
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {job.started_at
                                    ? formatDateTime(job.started_at)
                                    : "Not started"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Completed
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {job.completed_at
                                    ? formatDateTime(job.completed_at)
                                    : "Not completed"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase text-slate-400">
                                Review
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                                {job.review
                                    ? `${job.review.rating}/5`
                                    : "No review yet"}
                            </dd>
                        </div>
                    </dl>
                </Card>

                {/* Timeline */}
                <Card className="h-fit p-6">
                    <h2 className="font-semibold text-slate-900">
                        Status
                    </h2>

                    <ul className="mt-4 space-y-4">
                        {[
                            { label: "Assigned", done: true },
                            { label: "Started", done: !!job.started_at },
                            { label: "Completed", done: !!job.completed_at }
                        ].map((step) => (
                            <li key={step.label} className="flex items-center gap-3">
                                {step.done ? (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <Icon name="check" className="h-4 w-4" />
                                    </span>
                                ) : (
                                    <span className="h-6 w-6 rounded-full border-2 border-slate-200" />
                                )}
                                <span
                                    className={
                                        step.done
                                            ? "text-sm font-medium text-slate-900"
                                            : "text-sm text-slate-400"
                                    }
                                >
                                    {step.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
}

export default JobDetail;