import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    completeJob,
    fetchMyJobs,
    startJob
} from "../../services/jobService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import {
    formatCurrency,
    formatDate,
    statusColor,
    statusLabel
} from "../../lib/format";

function ProviderJobs() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchMyJobs();

                if (!cancelled) {
                    setJobs(data.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load your jobs. Please try again."
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

    const refresh = () => {
        setLoading(true);

        fetchMyJobs()
            .then((data) => setJobs(data.data))
            .catch(() => setError("Unable to refresh jobs."))
            .finally(() => setLoading(false));
    };

    const handleAction = async (jobId, action) => {
        setBusyId(jobId);

        try {
            if (action === "start") {
                await startJob(jobId);
            } else {
                await completeJob(jobId);
            }

            refresh();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Action could not be completed."
            );
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Jobs, {user?.first_name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Jobs assigned to you. Start work and mark completion
                    when done.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : error ? (
                <EmptyState
                    title="Could not load jobs"
                    description={error}
                />
            ) : jobs.length === 0 ? (
                <EmptyState
                    title="No jobs yet"
                    description="When a customer accepts your offer, the job appears here."
                />
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <Card
                            key={job.id}
                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:flex-wrap"
                        >
                            <Link
                                to={`/provider/jobs/${job.id}`}
                                className="min-w-0"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                        <Icon
                                            name="briefcase"
                                            className="h-5 w-5"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                                            {job.request_title}
                                        </h3>
                                        <p className="mt-0.5 text-sm text-slate-500">
                                            {job.customer_first_name}{" "}
                                            {job.customer_last_name} ·{" "}
                                            {job.request_location} ·{" "}
                                            {formatDate(job.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span className="font-medium text-slate-700">
                                    {formatCurrency(job.offer_price)}
                                </span>
                                <Badge color={statusColor(job.status)}>
                                    {statusLabel(job.status)}
                                </Badge>
                                {(job.status === "ASSIGNED" ||
                                    job.status === "IN_PROGRESS") && (
                                    <div className="flex gap-2">
                                        {job.status === "ASSIGNED" && (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleAction(
                                                        job.id,
                                                        "start"
                                                    )
                                                }
                                                loading={busyId === job.id}
                                            >
                                                Start
                                            </Button>
                                        )}
                                        {job.status === "IN_PROGRESS" && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    handleAction(
                                                        job.id,
                                                        "complete"
                                                    )
                                                }
                                                loading={busyId === job.id}
                                            >
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProviderJobs;