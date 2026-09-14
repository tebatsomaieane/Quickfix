import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyJobs } from "../../services/jobService";
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

function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    My jobs
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Track every job from assignment to completion.
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
                    description="Once you accept an offer, the job appears here and you can track it."
                />
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <Link key={job.id} to={`/customer/jobs/${job.id}`}>
                            <Card className="flex flex-col gap-3 p-4 transition hover:border-indigo-300 hover:shadow sm:flex-row sm:items-center sm:justify-between sm:flex-wrap">
                                <div className="flex min-w-0 items-center gap-4">
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
                                            {job.service_name} ·{" "}
                                            {job.provider_first_name}{" "}
                                            {job.provider_last_name} ·{" "}
                                            {job.request_location}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <span className="font-medium text-slate-700">
                                        {formatCurrency(job.offer_price)}
                                    </span>
                                    <Badge color={statusColor(job.status)}>
                                        {statusLabel(job.status)}
                                    </Badge>
                                    <span className="text-slate-400">
                                        {formatDate(job.created_at)}
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Jobs;