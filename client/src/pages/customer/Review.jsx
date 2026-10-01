import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchJob } from "../../services/jobService";
import { createReview } from "../../services/reviewService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";
import {
    formatCurrency,
    formatDateTime
} from "../../lib/format";

const RATING_LABELS = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very good",
    5: "Excellent"
};

/**
 * The rating is the only field the server insists on, and the comment is the
 * only one it bounds.
 *
 * The rating rule is a bounds check rather than `required`, because 0 here means
 * "not chosen yet" and `required` only treats null/undefined/"" as missing -- a
 * zero would sail straight through it. `number` with a floor of 1 is what
 * actually rejects an untouched rating.
 */
const SCHEMA = {
    rating: [
        rules.number({
            label: "Rating",
            integer: true,
            min: 1,
            max: 5,
            message: "Please choose a rating between 1 and 5 stars"
        })
    ],
    comment: [
        rules.maxLength(2000, "Comment must be 2000 characters or fewer")
    ]
};

function ReviewJob() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [hover, setHover] = useState(0);

    // Memoised so the hook's reset target keeps a stable identity, and so the
    // rating genuinely starts unset: defaulting it to 1 would file a score
    // nobody gave.
    const initialValues = useMemo(() => ({ rating: 0, comment: "" }), []);

    const {
        values,
        fieldErrors,
        formError,
        announcement,
        pending,
        setValue,
        handleChange,
        handleBlur,
        validateAll,
        run
    } = useActionFeedback({ schema: SCHEMA, initialValues });

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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateAll(values)) {
            return;
        }

        const { ok } = await run(
            () =>
                createReview({
                    jobId: job.id,
                    rating: Number(values.rating),
                    comment: values.comment.trim() || undefined
                }),
            { retry: true }
        );

        if (ok) {
            navigate(`/customer/jobs/${job.id}`);
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

            <form onSubmit={handleSubmit} noValidate>
                <Card className="mt-6 p-6">
                    <h2 className="font-semibold text-slate-900">
                        How was the service?
                    </h2>

                    {/* The scale is exposed as a radiogroup so a screen reader
                        hears one control with a position rather than five
                        unlabelled buttons, and the chosen star is announced. */}
                    <div
                        role="radiogroup"
                        aria-label="Overall rating out of 5"
                        aria-describedby={
                            fieldErrors.rating ? "rating-error" : undefined
                        }
                        aria-invalid={fieldErrors.rating ? true : undefined}
                        onMouseLeave={() => setHover(0)}
                        className="mt-4 flex items-center gap-1"
                    >
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={values.rating === value}
                                aria-label={`${value} of 5 — ${RATING_LABELS[value]}`}
                                onClick={() => setValue("rating", value)}
                                onMouseEnter={() => setHover(value)}
                                className="rounded-lg p-1 text-slate-300 transition hover:text-amber-400"
                            >
                                <Icon
                                    name="star"
                                    className={[
                                        "h-8 w-8",
                                        (hover || values.rating) >= value
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-slate-300"
                                    ].join(" ")}
                                />
                            </button>
                        ))}
                        <span className="ml-2 text-sm font-medium text-slate-700">
                            {values.rating > 0
                                ? `${values.rating} / 5 — ${RATING_LABELS[values.rating]}`
                                : "Select a rating"}
                        </span>
                    </div>

                    {fieldErrors.rating && (
                        <p
                            id="rating-error"
                            role="alert"
                            className="mt-2 text-sm font-medium text-red-600"
                        >
                            {fieldErrors.rating}
                        </p>
                    )}

                    <div className="mt-5">
                        <label
                            htmlFor="review-comment"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Comment (optional)
                        </label>
                        <Textarea
                            id="review-comment"
                            name="comment"
                            rows="4"
                            placeholder="Share what went well..."
                            value={values.comment}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={2000}
                            error={fieldErrors.comment}
                        />
                    </div>

                    {formError && (
                        <div
                            role="alert"
                            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {formError}
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        <Button type="submit" loading={pending}>
                            Submit review
                        </Button>
                        <Link to={`/customer/jobs/${job.id}`}>
                            <Button variant="outline">Cancel</Button>
                        </Link>
                    </div>

                    <p aria-live="polite" className="sr-only">
                        {announcement}
                    </p>
                </Card>
            </form>
        </div>
    );
}

export default ReviewJob;