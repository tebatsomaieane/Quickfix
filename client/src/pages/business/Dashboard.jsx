import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { fetchProfile, fetchAnalytics } from "../../services/businessService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
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
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Welcome back, {user?.first_name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {profile ? profile.name : "Manage your business profile, promotions, advertisements and products."}
                </p>
            </div>

            {profile && (
                <Card className="mb-6 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-indigo-100 p-3">
                                <Icon name="building" className="h-6 w-6 text-indigo-700" />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{profile.name}</p>
                                <p className="text-sm text-slate-500">{profile.location || "No location set"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge color={VERIFICATION_COLORS[profile.verification_status] || "gray"}>
                                {profile.verification_status.toLowerCase().replace("_", " ")}
                            </Badge>
                            <Link to="/business/profile">
                                <Button size="sm" variant="secondary">Edit profile</Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            )}

            {analytics && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link to="/business/products">
                        <Card className="p-5 hover:ring-2 hover:ring-indigo-200 transition">
                            <p className="text-sm font-medium text-slate-500">Products</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.products.total}</p>
                            <p className="text-xs text-slate-400">{analytics.products.active} active</p>
                        </Card>
                    </Link>
                    <Link to="/business/advertisements">
                        <Card className="p-5 hover:ring-2 hover:ring-indigo-200 transition">
                            <p className="text-sm font-medium text-slate-500">Advertisements</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.advertisements.total}</p>
                            <p className="text-xs text-slate-400">{analytics.advertisements.active} active</p>
                        </Card>
                    </Link>
                    <Link to="/business/promotions">
                        <Card className="p-5 hover:ring-2 hover:ring-indigo-200 transition">
                            <p className="text-sm font-medium text-slate-500">Promotions</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">{analytics.promotions.total}</p>
                            <p className="text-xs text-slate-400">{analytics.promotions.active} active</p>
                        </Card>
                    </Link>
                    <Link to="/business/analytics">
                        <Card className="p-5 hover:ring-2 hover:ring-indigo-200 transition">
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