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
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
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

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div>
            <div className="mb-5 sm:mb-6">
                <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                    Administration
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Platform overview and management. Welcome,{" "}
                    {user?.first_name}.
                </p>
            </div>

            {stats ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

            {hasActions ? (
                <div className="mt-8 sm:mt-10">
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                        Action center
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Items that need your attention.
                    </p>

                    <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-3">
                        {actionItems.map((item) => (
                            item.value === 0 ? null : (
                                <Link key={item.label} to={item.to}>
                                    <Card pressable className="flex h-full items-center gap-3 p-4 sm:gap-4 sm:p-5">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-12 sm:w-12">
                                            <Icon name={item.icon} className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0">
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
            ) : (
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
            )}
        </div>
    );
}

export default AdminDashboard;