import { useEffect, useState } from "react";
import { fetchAnalytics } from "../../services/businessService";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";

function StatCard({ icon, label, value, sub, color = "indigo" }) {
    const colors = {
        indigo: "bg-indigo-100 text-indigo-700",
        green: "bg-green-100 text-green-700",
        amber: "bg-amber-100 text-amber-700",
        slate: "bg-slate-100 text-slate-700"
    };

    return (
        <Card className="p-5">
            <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${colors[color]}`}>
                    <Icon name={icon} className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    {sub && <p className="text-xs text-slate-400">{sub}</p>}
                </div>
            </div>
        </Card>
    );
}

function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics()
            .then((d) => setData(d.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    if (!data) {
        return <Card className="p-8 text-center"><p className="text-slate-500">Unable to load analytics.</p></Card>;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
                <p className="mt-1 text-sm text-slate-500">A snapshot of your business activity on QuickFix.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon="inbox"
                    label="Products"
                    value={data.products.total}
                    sub={`${data.products.active} active · ${data.products.inactive} inactive`}
                    color="indigo"
                />
                <StatCard
                    icon="megaphone"
                    label="Advertisements"
                    value={data.advertisements.total}
                    sub={`${data.advertisements.active} active · ${data.advertisements.pending} pending`}
                    color="green"
                />
                <StatCard
                    icon="bolt"
                    label="Promotions"
                    value={data.promotions.total}
                    sub={`${data.promotions.active} active · ${data.promotions.pending} pending`}
                    color="amber"
                />
                <StatCard
                    icon="users"
                    label="Linked Providers"
                    value={data.linkedProviders}
                    color="slate"
                />
            </div>

            <Card className="mt-6 p-6">
                <h2 className="font-semibold text-slate-900">Activity breakdown</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-3">
                    <div>
                        <h3 className="text-sm font-medium text-slate-500">Products</h3>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-indigo-600"
                                style={{ width: data.products.total ? `${(data.products.active / data.products.total) * 100}%` : "0%" }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            {data.products.total ? Math.round((data.products.active / data.products.total) * 100) : 0}% active
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-500">Advertisements</h3>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-green-600"
                                style={{ width: data.advertisements.total ? `${(data.advertisements.active / data.advertisements.total) * 100}%` : "0%" }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            {data.advertisements.total ? Math.round((data.advertisements.active / data.advertisements.total) * 100) : 0}% active
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-500">Promotions</h3>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-amber-600"
                                style={{ width: data.promotions.total ? `${(data.promotions.active / data.promotions.total) * 100}%` : "0%" }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            {data.promotions.total ? Math.round((data.promotions.active / data.promotions.total) * 100) : 0}% active
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

export default Analytics;