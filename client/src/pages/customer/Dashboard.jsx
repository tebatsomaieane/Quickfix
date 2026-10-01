import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyRequests } from "../../services/requestService";
import {
    fetchCategories,
    fetchMarketSummary,
    fetchActivePromotions,
    fetchActiveAdvertisements
} from "../../services/catalogueService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import MediaRail from "../../components/ui/MediaRail";
import SmartImage from "../../components/ui/SmartImage";
import {
    formatCurrency,
    formatDate,
    statusColor,
    statusLabel
} from "../../lib/format";
import { getCategoryImage, getBusinessImage } from "../../lib/visuals";

function StoreCard({ ad, wide = false }) {
    return (
        <Link
            to="/customer/products"
            className={`group block ${wide ? "w-[15rem] shrink-0" : "h-full"}`}
        >
            <Card
                hover
                className="h-full overflow-hidden p-0"
            >
                <div className="relative h-32">
                    <SmartImage
                        src={getBusinessImage(ad)}
                        alt={ad.title}
                        seed={ad.title}
                        icon="building"
                        className="qf-img-zoom h-full w-full object-cover"
                    />
                    {ad.business_verified === "APPROVED" && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-emerald-600 shadow">
                            <Icon
                                name="checkBadge"
                                className="h-3.5 w-3.5"
                            />
                            Verified
                        </span>
                    )}
                </div>
                <div className="p-4">
                    <h4 className="font-semibold text-slate-900 line-clamp-1">
                        {ad.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {ad.business_name}
                        {ad.business_location
                            ? ` · ${ad.business_location}`
                            : ""}
                    </p>
                </div>
            </Card>
        </Link>
    );
}

function PromotionCard({ promo, wide = false }) {
    return (
        <Card
            className={`flex flex-col p-4 ${wide ? "w-[15rem] shrink-0" : "h-full"}`}
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-900">
                    {promo.title}
                </h4>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-extrabold text-amber-700">
                    {promo.discount}%
                </span>
            </div>
            {promo.description && (
                <p className="mt-1 flex-1 text-sm text-slate-600 line-clamp-2">
                    {promo.description}
                </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
                {promo.business_name}
                {promo.business_location
                    ? ` · ${promo.business_location}`
                    : ""}
                {" · "}ends {formatDate(promo.end_date)}
            </p>
        </Card>
    );
}

function CustomerDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [summary, setSummary] = useState(null);
    const [categories, setCategories] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [advertisements, setAdvertisements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [
                    requestsData,
                    summaryData,
                    categoriesData,
                    promotionsData,
                    adsData
                ] = await Promise.all([
                    fetchMyRequests(),
                    fetchMarketSummary(),
                    fetchCategories(),
                    fetchActivePromotions().catch(() => ({ data: [] })),
                    fetchActiveAdvertisements().catch(() => ({ data: [] }))
                ]);

                if (!cancelled) {
                    setRequests(requestsData.data);
                    setSummary(summaryData.data);
                    setCategories(categoriesData.data);
                    setPromotions(promotionsData.data);
                    setAdvertisements(adsData.data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Unable to load your dashboard. Please try again."
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

    const openRequests = requests.filter(
        (request) =>
            request.status === "OPEN" ||
            request.status === "OFFERS_RECEIVED"
    );

    const activeJobs = requests.filter(
        (request) =>
            request.status === "PROVIDER_SELECTED" ||
            request.status === "IN_PROGRESS"
    );

    const completed = requests.filter(
        (request) => request.status === "COMPLETED"
    );

    const recentRequests = requests.slice(0, 5);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <EmptyState
                title="Could not load dashboard"
                description={error}
            />
        );
    }

    return (
        <div>
            {/* Welcome banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl shadow-indigo-200/50">
                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <div className="grid gap-0 lg:grid-cols-2">
                    <div className="p-5 sm:p-8">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">
                            {new Date().toLocaleDateString("en-GB", {
                                weekday: "long",
                                day: "numeric",
                                month: "long"
                            })}
                        </p>
                        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                            Welcome back, {user?.first_name}
                        </h1>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-indigo-100">
                            What needs fixing today? Post a request and let
                            verified local providers compete for your job — or
                            browse the marketplace for ideas.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2.5">
                            <Link to="/customer/requests/new" className="min-w-0">
                                <Button className="w-full bg-white text-indigo-700 shadow-lg hover:bg-indigo-50 sm:w-auto">
                                    <Icon name="plus" className="h-4 w-4" />
                                    Post a request
                                </Button>
                            </Link>
                            <Link
                                to="/customer/services"
                                className="min-w-0"
                            >
                                <Button
                                    variant="ghost"
                                    className="w-full text-white hover:bg-white/10 sm:w-auto"
                                >
                                    Browse services
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="relative hidden lg:block">
                        <SmartImage
                            alt="A provider at work"
                            seed="customer welcome"
                            icon="wrench"
                            className="h-full min-h-[16rem] w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-violet-700/40" />
                    </div>
                </div>
            </section>

            {/* Personal stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4">
                <StatCard
                    icon="file"
                    label="Total requests"
                    value={requests.length}
                    tone="indigo"
                    hint="All time"
                />
                <StatCard
                    icon="inbox"
                    label="Open requests"
                    value={openRequests.length}
                    tone="violet"
                    hint="Awaiting offers"
                />
                <StatCard
                    icon="briefcase"
                    label="Active jobs"
                    value={activeJobs.length}
                    tone="emerald"
                    hint="In progress"
                />
                <StatCard
                    icon="checkCircle"
                    label="Completed"
                    value={completed.length}
                    tone="sky"
                    hint="Jobs done"
                />
            </div>

            {/* Marketplace overview */}
            <section className="mt-7 sm:mt-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-slate-900">
                            Marketplace overview
                        </h2>
                        <p className="text-sm text-slate-500">
                            What's live on QuickFix right now
                        </p>
                    </div>
                    {/* Scrolls rather than squashing on narrow phones */}
                    <div className="qf-scroll-x -mx-3.5 flex w-full gap-2 overflow-x-auto px-3.5 pb-1 sm:mx-0 sm:w-auto sm:px-0 sm:pb-0">
                        <Link to="/customer/services" className="shrink-0">
                            <Button variant="outline" size="sm">
                                Services
                            </Button>
                        </Link>
                        <Link to="/customer/products" className="shrink-0">
                            <Button variant="outline" size="sm">
                                Products
                            </Button>
                        </Link>
                        <Link to="/customer/providers" className="shrink-0">
                            <Button variant="outline" size="sm">
                                Providers
                            </Button>
                        </Link>
                    </div>
                </div>

                {summary && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                        <StatCard icon="wrench" label="Services advertised" value={summary.services} tone="indigo" />
                        <StatCard icon="inbox" label="Products advertised" value={summary.products} tone="amber" />
                        <StatCard icon="users" label="Registered providers" value={summary.providers} tone="emerald" />
                        <StatCard icon="building" label="Stores & cafés" value={summary.businesses} tone="violet" />
                    </div>
                )}
            </section>

            {/* Category tiles */}
            {categories.length > 0 && (
                <section className="mt-7 sm:mt-8">
                    <h2 className="mb-3 text-lg font-bold text-slate-900">
                        Browse by category
                    </h2>

                    {/* Phones get a rail that drifts left so more than one
                        category is discoverable without a long scroll. */}
                    <div className="lg:hidden">
                        <MediaRail
                            label="Service categories"
                            speed={24}
                            railClassName="qf-rail-fade"
                        >
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/customer/services/${category.id}`}
                                    className="qf-lift group relative h-24 w-[9.5rem] shrink-0 overflow-hidden rounded-2xl shadow-sm sm:h-28 sm:w-40"
                                >
                                    <SmartImage
                                        src={getCategoryImage(category)}
                                        alt={category.name}
                                        seed={category.name}
                                        icon="grid"
                                        className="qf-img-zoom h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                                    <p className="absolute inset-x-0 bottom-0 p-2.5 text-sm font-bold text-white">
                                        {category.name}
                                    </p>
                                </Link>
                            ))}
                        </MediaRail>
                    </div>

                    <div className="hidden grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/customer/services/${category.id}`}
                                className="qf-lift group relative h-24 overflow-hidden rounded-2xl shadow-sm sm:h-28"
                            >
                                <SmartImage
                                    src={getCategoryImage(category)}
                                    alt={category.name}
                                    seed={category.name}
                                    icon="grid"
                                    className="qf-img-zoom h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                                <p className="absolute inset-x-0 bottom-0 p-2.5 text-sm font-bold text-white">
                                    {category.name}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Featured stores & promotions */}
            {(promotions.length > 0 || advertisements.length > 0) && (
                <section className="mt-8">
                    {advertisements.length > 0 && (
                        <div className="mb-6">
                            <h3 className="mb-3 text-lg font-bold text-slate-900">
                                Featured stores & cafés
                            </h3>

                            <div className="lg:hidden">
                                <MediaRail
                                    label="Featured stores and cafés"
                                    speed={26}
                                    railClassName="qf-rail-fade"
                                >
                                    {advertisements.map((ad) => (
                                        <StoreCard
                                            key={ad.id}
                                            ad={ad}
                                            wide
                                        />
                                    ))}
                                </MediaRail>
                            </div>

                            <div className="hidden gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-3">
                                {advertisements.map((ad) => (
                                    <StoreCard key={ad.id} ad={ad} />
                                ))}
                            </div>
                        </div>
                    )}

                    {promotions.length > 0 && (
                        <div>
                            <h3 className="mb-3 text-lg font-bold text-slate-900">
                                Current promotions
                            </h3>

                            <div className="lg:hidden">
                                <MediaRail
                                    label="Current promotions"
                                    speed={26}
                                    railClassName="qf-rail-fade"
                                >
                                    {promotions.map((promo) => (
                                        <PromotionCard
                                            key={promo.id}
                                            promo={promo}
                                            wide
                                        />
                                    ))}
                                </MediaRail>
                            </div>

                            <div className="hidden gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-3">
                                {promotions.map((promo) => (
                                    <PromotionCard
                                        key={promo.id}
                                        promo={promo}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Recent requests */}
            <section className="mt-8">
                {requests.length === 0 ? (
                    <Card className="p-8">
                        <EmptyState
                            title="No requests yet"
                            description="Post your first service request and receive offers from registered providers."
                            action={
                                <Link to="/customer/requests/new">
                                    <Button>Create a request</Button>
                                </Link>
                            }
                        />
                    </Card>
                ) : (
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Recent requests
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Track the progress of everything you've posted
                                </p>
                            </div>
                            <Link
                                to="/customer/requests"
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                View all
                            </Link>
                        </div>

                        <div className="mt-4 space-y-3">
                            {recentRequests.map((request) => (
                                <Link
                                    key={request.id}
                                    to={`/customer/requests/${request.id}`}
                                    className="qf-press-dim block rounded-2xl"
                                >
                                    <Card
                                        pressable
                                        className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-slate-900 line-clamp-1">
                                                {request.title}
                                            </h3>
                                            <p className="mt-0.5 text-sm text-slate-500">
                                                {request.service_name} ·{" "}
                                                {request.location}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-sm">
                                            <span className="font-medium text-slate-700">
                                                {formatCurrency(request.budget_min)}
                                                {request.budget_max
                                                    ? ` - ${formatCurrency(request.budget_max)}`
                                                    : "+"}
                                            </span>
                                            <Badge color={statusColor(request.status)}>
                                                {statusLabel(request.status)}
                                            </Badge>
                                            <span className="text-slate-400">
                                                {formatDate(request.created_at)}
                                            </span>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default CustomerDashboard;