import { useCallback, useEffect, useMemo, useState } from "react";
import {
    createComplaint,
    fetchMyComplaints
} from "../../services/complaintService";
import { fetchMyJobs } from "../../services/jobService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import useActionFeedback from "../../hooks/useActionFeedback";
import { rules } from "../../lib/validation";
import { formatDate } from "../../lib/format";

const STATUS_COLORS = {
    OPEN: "amber",
    UNDER_REVIEW: "blue",
    RESOLVED: "green",
    REJECTED: "red"
};

const INITIAL_VALUES = {
    job_id: "",
    subject: "",
    description: ""
};

/**
 * Mirrors `content.complaint` on the server. The minimum lengths exist because
 * an admin cannot act on "no show" or "bad service" -- they need a date, a place
 * and what was agreed, and those two fields are the only place to put it.
 */
const SCHEMA = {
    job_id: [rules.number({ label: "Related job", integer: true, min: 1 })],
    subject: [
        rules.required("Subject"),
        rules.minLength(4, "Give the subject a little more detail"),
        rules.maxLength(200, "Subject must be 200 characters or fewer")
    ],
    description: [
        rules.required("Details"),
        rules.minLength(10, "Please describe what happened in a bit more detail"),
        rules.maxLength(5000, "Details must be 5000 characters or fewer")
    ]
};

function Complaints() {
    const [complaints, setComplaints] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);

    const {
        values,
        fieldErrors,
        formError,
        announcement,
        pending,
        handleChange,
        handleBlur,
        validateAll,
        reset,
        run
    } = useActionFeedback({ schema: SCHEMA, initialValues: INITIAL_VALUES });

    const load = useCallback(() => {
        setLoading(true);
        setError("");

        Promise.all([fetchMyComplaints(), fetchMyJobs()])
            .then(([c, j]) => {
                setComplaints(c.data);
                setJobs(j.data);
            })
            .catch(() =>
                setError("Unable to load complaints. Please try again.")
            )
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Opening the form always starts from a clean slate, so a half-written
    // complaint abandoned earlier is not silently resubmitted with new text.
    const toggleForm = () => {
        setShowForm((visible) => {
            if (!visible) {
                reset(INITIAL_VALUES);
            }

            return !visible;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateAll(values)) {
            return;
        }

        const { ok } = await run(
            () =>
                createComplaint({
                    job_id: values.job_id || undefined,
                    subject: values.subject.trim(),
                    description: values.description.trim()
                }),
            {
                success: "Complaint submitted. Our team will review it shortly.",
                retry: true
            }
        );

        if (ok) {
            reset(INITIAL_VALUES);
            setShowForm(false);
            load();
        }
    };

    // The job list is empty until it arrives, and an empty `Select` with nothing
    // but its placeholder reads as broken, so say what it means.
    const jobOptions = useMemo(
        () =>
            jobs.map((job) => ({
                value: job.id,
                label: `Job #${job.id} — ${job.title}`
            })),
        [jobs]
    );

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Complaints
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Report a problem with a job. The admin team will
                        review it.
                    </p>
                </div>
                <Button onClick={toggleForm}>
                    {showForm ? "Close form" : "New complaint"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 p-6">
                    <h2 className="font-semibold text-slate-900">
                        Submit a complaint
                    </h2>

                    {formError && (
                        <div
                            role="alert"
                            className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
                        <Select
                            label="Related job (optional)"
                            id="job_id"
                            name="job_id"
                            placeholder="Not related to a job"
                            options={jobOptions}
                            value={values.job_id}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={fieldErrors.job_id}
                        />

                        <Input
                            label="Subject"
                            id="subject"
                            name="subject"
                            placeholder="e.g. Provider did not show up"
                            value={values.subject}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={200}
                            error={fieldErrors.subject}
                            required
                        />

                        <Textarea
                            label="Details"
                            id="description"
                            name="description"
                            rows="4"
                            placeholder="Describe what went wrong, including when it happened and what was agreed."
                            value={values.description}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={5000}
                            error={fieldErrors.description}
                            hint="Include dates and amounts where you can — it speeds up the review."
                            required
                        />

                        <Button type="submit" loading={pending}>
                            Submit complaint
                        </Button>

                        <p aria-live="polite" className="sr-only">
                            {announcement}
                        </p>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState
                    title="Something went wrong"
                    description={error}
                />
            ) : complaints.length === 0 ? (
                <EmptyState
                    title="No complaints"
                    description="If a job goes wrong, raise a complaint here and the admin team will step in."
                />
            ) : (
                <div className="space-y-4">
                    {complaints.map((complaint) => (
                        <Card key={complaint.id} className="p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">
                                            {complaint.subject}
                                        </h3>
                                        <Badge
                                            color={
                                                STATUS_COLORS[
                                                    complaint.status
                                                ] || "gray"
                                            }
                                        >
                                            {complaint.status
                                                .toLowerCase()
                                                .replace("_", " ")}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {complaint.job_id
                                            ? `Job #${complaint.job_id}${
                                                  complaint.request_title
                                                      ? ` — ${complaint.request_title}`
                                                      : ""
                                              } · `
                                            : ""}
                                        {formatDate(complaint.created_at)}
                                    </p>
                                </div>
                            </div>

                            {complaint.admin_response && (
                                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                                    <p className="text-sm font-medium text-slate-700">
                                        Admin response
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {complaint.admin_response}
                                    </p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Complaints;