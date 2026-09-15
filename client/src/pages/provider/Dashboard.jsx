import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyProviderProfile } from "../../services/catalogueService";
import { fetchMyJobs } from "../../services/jobService";
import { fetchMyOffers } from "../../services/offerService";
import { fetchAvailableRequests } from "../../services/requestService";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import StatCard from "../../components/ui/StatCard";
import ProviderAvatar from "../../components/ui/ProviderAvatar";
import VerificationBadge from "../../components/ui/VerificationBadge";
import Icon from "../../components/ui/Icon";
import SmartImage from "../../components/ui/SmartImage";
import {
    formatCurrency,
    statusColor,
    statusLabel
} from "../../lib/format";
import { getProviderPortrait } from "../../lib/visuals";

function ProviderDashboard() {
    const [profile, setProfile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [offers, setOffers] = useState([]);
    const [openRequests, setOpenRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [
                    profileData,
                    jobsData,
                    offersData,
                    openData
                ] = await Promise.all([
                    fetchMyProviderProfile().catch(() => null),
                    fetchMyJobs().catch(() => ({ data: [] })),
                    fetchMyOffers().catch(() => ({ data: [] })),
                    fetchAvailableRequests().catch(() => ({ data: [] }))
                ]);

                if (!cancelled) {
                    setProfile(
                        profileData?.data || null
                    );
                    setJobs(
                        Array.isArray(jobsData?.data) ? jobsData.data : []
                    );
                    setOffers(
                        Array.isArray(offersData?.data) ? offersData.data : []
                    );
                    setOpenRequests(
                        Array.isArray(openData?.data) ? openData.data : []
                    );
                }
            } catch {
                if (!cancelled) {
                    setProfile(null);
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

    const verificationSteps = [
        {
            label: "Profile created",
            done: Boolean(profile?.id),
            icon: "user"
        },
        {
            label: "Services added",
            done: (profile?.services?.length || 0) > 0,
            icon: "wrench"
        },
        {
            label: "Availability set",
            done: (profile?.availability?.length || 0) > 0,
            icon: "clock"
        }
    ];

    const jobsToStart = jobs.filter((job) => job.status === "ASSIGNED");
    const jobsInProgress = jobs.filter(
        (job) => job.status === "IN_PROGRESS"
    );
    const pendingOffers = offers.filter(
        (offer) => offer.status === "PENDING"
    );

    const actionItems = [
        {
            label: "Jobs to start",
            count: jobsToStart.length,
            description: "Accepted jobs awaiting your first move",
            icon: "briefcase",
            tone: "emerald",
            to: "/provider/jobs"
        },
        {
            label: "Jobs in progress",
            count: jobsInProgress.length,
            description: "Work you are currently on",
            icon: "wrench",
            tone: "indigo",
            to: "/provider/jobs"
        },
        {
            label: "Offers pending decision",
            count: pendingOffers.length,
            description: "Offers waiting on the customer",
            icon: "chat",
            tone: "amber",
            to: "/provider/offers"
        },
        {
            label: "Open requests to bid on",
            count: openRequests.length,
            description: "New opportunities in your area",
            icon: "inbox",
            tone: "violet",
            to: "/provider/requests"
        }
    ];

    const hasActionItems = actionItems.some((item) => item.count > 0);

    return (
        <div>
            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : profile ? (
                <>
                    {/* Workbench banner */}
                    <section className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl shadow-slate-900/20">
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-2xl" aria-hidden="true" />
                        <div className="absolute bottom-0 right-32 hidden h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl lg:block" aria-hidden="true" />
                        <div className="grid gap-0 lg:grid-cols-2">
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <Icon name="bolt" className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">
                                        QuickFix Pro workspace
                                    </span>
                                </div>
                                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                    Welcome back, {profile.first_name}
                                </h1>
                                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                                    Your workbench is live. New requests and
                                    job alerts land here so you never miss an
                                    opportunity.
                                </p>
                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 pr-5 backdrop-blur">
                                        <ProviderAvatar
                                            name={`${profile.first_name} ${profile.last_name}`}
                                            image={getProviderPortrait(profile, Number(profile.id) || 0)}
                                            seed={`${profile.first_name} ${profile.last_name}`}
                                            size="sm"
                                        />
                                        <div>
                                            <p className="text-xs text-slate-300">Verified as</p>
                                            <p className="text-sm font-bold text-white">
                                                {profile.first_name} {profile.last_name}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge
                                        color={statusColor(profile.verification_status)}
                                        className="!bg-white/10 !px-3 !py-1 !text-xs !font-bold !text-white"
                                    >
                                        {statusLabel(profile.verification_status)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="relative hidden lg:block">
<SmartImage
                                    src={null}
                                    alt="Tools of a working provider"
                                    seed="provider tools"
                                    icon="tools"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
                            </div>
                        </div>
                    </section>

                    {/* Action center */}
                    <section className="mt-6">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Action center
                                </h2>
                                <p className="text-sm text-slate-500">
                                    What needs your attention right now
                                </p>
                            </div>
                            <Link
                                to="/provider/requests"
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Browse requests
                            </Link>
                        </div>

                        {hasActionItems ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {actionItems.map((item) => (
                                    <Link key={item.label} to={item.to}>
                                        <Card
                                            className={[
                                                "flex h-full flex-col p-4 transition",
                                                item.count > 0
                                                    ? "hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                                                    : "opacity-60"
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                    <Icon
                                                        name={item.icon}
                                                        className="h-4 w-4"
                                                    />
                                                </span>
                                                <span className="text-2xl font-extrabold text-slate-900">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-slate-900">
                                                {item.label}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {item.description}
                                            </p>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                        <Icon
                                            name="checkCircle"
                                            className="h-5 w-5"
                                        />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            You are all caught up
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            No pending jobs, offers or open
                                            requests right now.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </section>

                    {/* Profile summary */}
                    <Card className="mb-6 mt-6 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <ProviderAvatar
                                    name={`${profile.first_name} ${profile.last_name}`}
                                    image={getProviderPortrait(profile, Number(profile.id) || 0)}
                                    seed={`${profile.first_name} ${profile.last_name}`}
                                    size="md"
                                />
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold text-slate-900">
                                            {profile.first_name}{" "}
                                            {profile.last_name}
                                        </h2>
                                        <VerificationBadge
                                            verified={
                                                profile.verification_status ===
                                                "APPROVED"
                                            }
                                        />
                                    </div>
                                    <p className="mt-0.5 text-sm text-slate-500">
                                        {profile.location || "Location not set"} ·{" "}
                                        {profile.experience_years || 0} years
                                        experience
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Getting-started checklist */}
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {verificationSteps.map((step, index) => (
                                <div
                                    key={step.label}
                                    className={[
                                        "flex items-center gap-3 rounded-xl border p-3",
                                        step.done
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-slate-200 bg-slate-50"
                                    ].join(" ")}
                                >
                                    <span
                                        className={[
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                                            step.done
                                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                                : "bg-slate-300"
                                        ].join(" ")}
                                    >
                                        {step.done ? (
                                            <Icon name="check" className="h-4 w-4" />
                                        ) : (
                                            <span className="text-xs font-bold">
                                                {index + 1}
                                            </span>
                                        )}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {step.label}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {step.done ? "Complete" : "In progress"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard
                            icon="wrench"
                            label="Active services"
                            value={profile.services.length}
                            tone="emerald"
                        />
                        <StatCard
                            icon="briefcase"
                            label="Completed jobs"
                            value={profile.completed_jobs || 0}
                            tone="indigo"
                        />
                        <StatCard
                            icon="star"
                            label="Rating"
                            value={profile.rating ?? "—"}
                            tone="amber"
                        />
                        <StatCard
                            icon="clock"
                            label="Availability days"
                            value={profile.availability.length}
                            tone="violet"
                        />
                    </div>

                    {/* Services */}
                    <h2 className="mb-3 font-semibold text-slate-900">
                        Your services & pricing
                    </h2>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Service
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {profile.services.map((service) => (
                                        <tr key={service.id}>
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {service.name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {service.category_name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {formatCurrency(service.price)}
                                            </td>
                                        </tr>
                                    ))}
                                    {profile.services.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="px-4 py-8 text-center text-slate-400"
                                            >
                                                You have not added any services
                                                yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            ) : (
                <Card className="p-8 text-center">
                    <Icon
                        name="user"
                        className="mx-auto h-10 w-10 text-slate-300"
                    />
                    <h2 className="mt-3 font-semibold text-slate-900">
                        Provider profile not found
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Your provider profile could not be loaded.
                    </p>
                </Card>
            )}
        </div>
    );
}

export default ProviderDashboard;