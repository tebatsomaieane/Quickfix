import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { fetchProfile, fetchAnalytics } from "../../services/businessService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import Icon from "../../components/ui/Icon";

const VERIFICATION_COLORS = {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "red"
};

function BusinessDashboard() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchProfile(), fetchAnalytics()])
            .then(([p, a]) => { setProfile(p.data); setAnalytics(a.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div>
            <div className="mb-5 sm:mb-6">
                <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                    Welcome back, {user?.first_name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {profile ? profile.name : "Manage your business profile, promotions, advertisements and products."}
                </p>
            </div>

            {profile && (
                <Card className="mb-5 p-4 sm:mb-6 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="shrink-0 rounded-xl bg-indigo-100 p-2.5 sm:p-3">
                                <Icon name="building" className="h-6 w-6 text-indigo-700" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{profile.name}</p>
                                <p className="truncate text-sm text-slate-500">{profile.location || "No location set"}</p>
                            </div>
                        </div>
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                            <Badge color={VERIFICATION_COLORS[profile.verification_status] || "gray"}>
                                {profile.verification_status.toLowerCase().replace("_", " ")}
                            </Badge>
                            <Link to="/business/profile" className="ml-auto sm:ml-0">
                                <Button size="sm" variant="secondary">Edit profile</Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            )}

            {analytics && (
                <div className="qf-stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <Link to="/business/products" style={{ "--qf-i": 0 }}>
                        <Card hover className="h-full p-4 sm:p-5">
                            <p className="text-sm font-medium text-slate-500">Products</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.products.total}</p>
                            <p className="text-xs text-slate-400">{analytics.products.active} active</p>
                        </Card>
                    </Link>
                    <Link to="/business/advertisements" style={{ "--qf-i": 1 }}>
                        <Card hover className="h-full p-4 sm:p-5">
                            <p className="text-sm font-medium text-slate-500">Advertisements</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.advertisements.total}</p>
                            <p className="text-xs text-slate-400">{analytics.advertisements.active} active</p>
                        </Card>
                    </Link>
                    <Link to="/business/promotions" style={{ "--qf-i": 2 }}>
                        <Card hover className="h-full p-4 sm:p-5">
                            <p className="text-sm font-medium text-slate-500">Promotions</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.promotions.total}</p>
                            <p className="text-xs text-slate-400">{analytics.promotions.active} active</p>
                        </Card>
                    </Link>
                    <Link to="/business/analytics" style={{ "--qf-i": 3 }}>
                        <Card hover className="h-full p-4 sm:p-5">
                            <p className="text-sm font-medium text-slate-500">Linked providers</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.linkedProviders}</p>
                        </Card>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default BusinessDashboard;