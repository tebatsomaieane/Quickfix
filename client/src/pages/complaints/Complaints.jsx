import { useEffect, useState } from "react";
import {
    createComplaint,
    fetchMyComplaints
} from "../../services/complaintService";
import { fetchMyJobs } from "../../services/jobService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { formatDate } from "../../lib/format";

const STATUS_COLORS = {
    OPEN: "amber",
    UNDER_REVIEW: "blue",
    RESOLVED: "green",
    REJECTED: "red"
};

function Complaints() {
    const [complaints, setComplaints] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        job_id: "",
        subject: "",
        description: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const load = () => {
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
    };

    useEffect(() => {
        load();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSubmitting(true);

        try {
            await createComplaint({
                job_id: form.job_id || undefined,
                subject: form.subject,
                description: form.description
            });

            setForm({ job_id: "", subject: "", description: "" });
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                    "Complaint could not be submitted."
            );
        } finally {
            setSubmitting(false);
        }
    };

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
                <Button onClick={() => setShowForm((v) => !v)}>
                    {showForm ? "Close form" : "New complaint"}
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6 p-6">
                    <h2 className="font-semibold text-slate-900">
                        Submit a complaint
                    </h2>

                    {formError && (
                        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div>
                            <label
                                htmlFor="complaint-job"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Related job (optional)
                            </label>
                            <select
                                id="complaint-job"
                                name="job_id"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                value={form.job_id}
                                onChange={handleChange}
                            >
                                <option value="">Not related to a job</option>
                                {jobs.map((job) => (
                                    <option key={job.id} value={job.id}>
                                        Job #{job.id} — {job.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Subject"
                            id="subject"
                            name="subject"
                            placeholder="e.g. Provider did not show up"
                            value={form.subject}
                            onChange={handleChange}
                            required
                        />

                        <div>
                            <label
                                htmlFor="description"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Details
                            </label>
                            <Textarea
                                id="description"
                                name="description"
                                rows="4"
                                placeholder="Describe what went wrong..."
                                value={form.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button type="submit" loading={submitting}>
                            Submit complaint
                        </Button>
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