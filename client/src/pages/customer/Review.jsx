import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchJob } from "../../services/jobService";
import { createReview } from "../../services/reviewService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import {
    formatCurrency,
    formatDateTime
} from "../../lib/format";

function ReviewJob() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchJob(jobId);

                if (!cancelled) {
                    if (
                        data.data.status !== "COMPLETED" ||
                        data.data.review
                    ) {
                        setError(
                            "This job cannot be reviewed."
                        );
                    } else {
                        setJob(data.data);
                    }
                }
            } catch {
                if (!cancelled) {
                    setError("Unable to load this job.");
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
    }, [jobId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating < 1) {
            setSubmitError("Please select a rating between 1 and 5.");

            return;
        }

        setSubmitting(true);
        setSubmitError("");

        try {
            await createReview({
                jobId: job.id,
                rating,
                comment: comment.trim() || undefined
            });

            navigate(`/customer/jobs/${job.id}`);
        } catch (err) {
            setSubmitError(
                err.response?.data?.message ||
                    "Review could not be submitted."
            );
            setSubmitting(false);
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
                title="Not reviewable"
                description={error}
                action={
                    <Button variant="outline">
                        <Link to="/customer/jobs">Back to my jobs</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Review your job
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Your feedback helps other customers choose the right
                    business.
                </p>
            </div>

            <Card className="p-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt className="text-xs uppercase text-slate-400">
                            Job
                        </dt>
                        <dd className="mt-1 font-medium text-slate-900">
                            {job.request_title}
                        </dd>
                    </div>
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
                            Agreed price
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                            {formatCurrency(job.offer_price)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase text-slate-400">
                            Completed
                        </dt>
                        <dd className="mt-1 text-sm text-slate-700">
                            {job.completed_at
                                ? formatDateTime(job.completed_at)
                                : "—"}
                        </dd>
                    </div>
                </dl>
            </Card>

            <form onSubmit={handleSubmit}>
                <Card className="mt-6 p-6">
                    <h2 className="font-semibold text-slate-900">
                        How was the service?
                    </h2>

                    {/* Rating picker */}
                    <div className="mt-4 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setRating(value)}
                                onMouseEnter={() => setHover(value)}
                                onMouseLeave={() => setHover(0)}
                                className="rounded-lg p-1 text-slate-300 transition hover:text-amber-400"
                                aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                            >
                                <Icon
                                    name="star"
                                    className={[
                                        "h-8 w-8",
                                        (hover || rating) >= value
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-slate-300"
                                    ].join(" ")}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-slate-700">
                            {rating > 0
                                ? `${rating} / 5`
                                : "Select a rating"}
                        </span>
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="review-comment"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Comment (optional)
                        </label>
                        <Textarea
                            id="review-comment"
                            rows="4"
                            placeholder="Share what went well..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    {submitError && (
                        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {submitError}
                        </p>
                    )}

                    <div className="mt-6 flex gap-3">
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={rating < 1}
                        >
                            Submit review
                        </Button>
                        <Link to={`/customer/jobs/${job.id}`}>
                            <Button variant="outline">Cancel</Button>
                        </Link>
                    </div>
                </Card>
            </form>
        </div>
    );
}

export default ReviewJob;