import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    fetchStats,
    fetchComplaints,
    fetchVerification,
    fetchBusinesses
} from "../../services/adminService";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import Icon from "../../components/ui/Icon";

function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [actions, setActions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await fetchStats();

                if (!cancelled) {
                    setStats(data.data);
                }
            } catch {
                if (!cancelled) {
                    setStats(null);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        Promise.allSettled([
            fetchVerification(),
            fetchBusinesses(),
            fetchComplaints()
        ]).then(([verification, businesses, complaints]) => {
            if (cancelled) {
                return;
            }

            const providerPending =
                verification.status === "fulfilled"
                    ? (verification.value.data || []).filter((r) =>
                          ["PENDING", "UNDER_REVIEW"].includes(r.status)
                      ).length
                    : 0;
            const businessPending =
                businesses.status === "fulfilled"
                    ? (businesses.value.data || []).filter(
                          (b) => b.verification_status === "PENDING"
                      ).length
                    : 0;
            const openComplaints =
                complaints.status === "fulfilled"
                    ? (complaints.value.data || []).filter(
                          (c) => c.status === "OPEN"
                      ).length
                    : 0;

            setActions({ providerPending, businessPending, openComplaints });
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const actionItems = actions
        ? [
              {
                  icon: "shield",
                  label: "Provider verifications pending",
                  value: actions.providerPending,
                  to: "/admin/verification"
              },
              {
                  icon: "building",
                  label: "Business verifications pending",
                  value: actions.businessPending,
                  to: "/admin/businesses"
              },
              {
                  icon: "bell",
                  label: "Open complaints",
                  value: actions.openComplaints,
                  to: "/admin/complaints"
              }
          ]
        : [];

    const hasActions = actionItems.some((item) => item.value > 0);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Administration
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Platform overview and management. Welcome,{" "}
                    {user?.first_name}.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard
                        icon="users"
                        label="Total users"
                        value={stats.users}
                    />
                    <StatCard
                        icon="briefcase"
                        label="Providers"
                        value={stats.providers}
                    />
                    <StatCard
                        icon="building"
                        label="Businesses"
                        value={stats.businesses}
                    />
                    <StatCard
                        icon="file"
                        label="Requests"
                        value={stats.requests}
                    />
                    <StatCard
                        icon="briefcase"
                        label="Jobs"
                        value={stats.jobs}
                    />
                    <StatCard
                        icon="checkCircle"
                        label="Completed jobs"
                        value={stats.completedJobs}
                    />
                    <StatCard
                        icon="bell"
                        label="Open complaints"
                        value={stats.openComplaints}
                    />
                    <StatCard
                        icon="megaphone"
                        label="Active ads"
                        value={stats.activeAdvertisements}
                    />
                </div>
            ) : (
                <Card className="p-8 text-center">
                    <Icon
                        name="chart"
                        className="mx-auto h-10 w-10 text-slate-300"
                    />
                    <h2 className="mt-3 font-semibold text-slate-900">
                        Statistics unavailable
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Platform statistics could not be loaded.
                    </p>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : hasActions ? (
                <div className="mt-10">
                    <h2 className="text-xl font-bold text-slate-900">
                        Action center
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Items that need your attention.
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        {actionItems.map((item) => (
                            item.value === 0 ? null : (
                                <Link key={item.label} to={item.to}>
                                    <Card className="flex items-center gap-4 p-5 transition hover:border-indigo-300 hover:shadow">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                            <Icon name={item.icon} className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">
                                                {item.value}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {item.label}
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            )
                        ))}
                    </div>
                </div>
            ) : stats ? (
                <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <Icon
                        name="checkCircle"
                        className="mx-auto h-10 w-10 text-green-500"
                    />
                    <h2 className="mt-3 font-semibold text-slate-900">
                        You are all caught up
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        No pending verifications or open complaints need your
                        attention.
                    </p>
                </div>
            ) : null}
        </div>
    );
}

export default AdminDashboard;