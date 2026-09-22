import { useEffect, useState } from "react";
import SmartImage from "../ui/SmartImage";
import Icon from "../ui/Icon";
import { fetchMarketOverview } from "../../services/catalogueService";

const FLOATING_TONES = {
    emerald: {
        box: "bg-emerald-500/20 text-emerald-300",
        icon: "checkBadge"
    },
    amber: {
        box: "bg-amber-500/20 text-amber-300",
        icon: "star"
    },
    indigo: {
        box: "bg-indigo-500/20 text-indigo-300",
        icon: "users"
    },
    sky: {
        box: "bg-sky-500/20 text-sky-300",
        icon: "briefcase"
    }
};

function AuthShell({
    children,
    image,
    imageSeed = "",
    imageIcon = "grid",
    eyebrow = "Get your job done, the easy way.",
    highlights = [],
    stats = []
}) {
    const [overview, setOverview] = useState(null);

    useEffect(() => {
        let cancelled = false;

        fetchMarketOverview()
            .then((data) => {
                if (!cancelled && data?.data && typeof data.data === "object") {
                    setOverview(data.data);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, []);

    const liveStats = overview
        ? [
              {
                  value: String(Number(overview.verifiedProviders) || 0),
                  label: "Verified providers",
                  tone: "emerald",
                  icon: "checkBadge"
              },
              {
                  value: String(Number(overview.completedJobs) || 0),
                  label: "Jobs completed",
                  tone: "sky",
                  icon: "briefcase"
              },
              ...(overview.avgRating !== null &&
              overview.avgRating !== undefined
                  ? [
                        {
                            value: Number(overview.avgRating).toFixed(1),
                            label: "Average rating",
                            tone: "amber",
                            icon: "star"
                        }
                    ]
                  : [])
          ]
        : [];

    const floating = stats.length > 0 ? stats : liveStats;

    const safeStats = floating.map((stat) => ({
        charge: FLOATING_TONES[stat.tone] || FLOATING_TONES.indigo,
        icon: stat.icon || FLOATING_TONES.indigo.icon,
        ...stat
    }));

    return (
        <div className="bg-slate-50">
            <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-12">
                {/* Mobile image banner */}
                <div className="relative mb-8 overflow-hidden rounded-3xl shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 lg:hidden">
                    <SmartImage
                        src={image}
                        alt={eyebrow}
                        seed={imageSeed}
                        icon={imageIcon}
                        eager
                        className="h-44 w-full object-cover object-[center_30%] sm:h-56"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                            <Icon name="sparkles" className="h-3 w-3" />
                            QuickFix
                        </span>
                        <h2 className="mt-2 text-xl font-extrabold leading-tight text-white">
                            {eyebrow}
                        </h2>
                        {highlights.length > 0 && (
                            <p className="mt-1 text-xs text-indigo-100">
                                {highlights[0]}
                            </p>
                        )}
                    </div>
                </div>

                {/* Form side */}
                <div className="mx-auto w-full max-w-md">{children}</div>

                {/* Visual side */}
                <div className="relative hidden lg:block">
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-200/50 ring-1 ring-slate-900/10">
                        <SmartImage
                            src={image}
                            alt={eyebrow}
                            seed={imageSeed}
                            icon={imageIcon}
                            eager
                            className="h-[36rem] w-full object-cover object-[center_30%]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/95 via-indigo-900/30 to-transparent" />

                        {/* Floating stat cards */}
                        {safeStats.length > 0 && (
                            <div className="absolute right-5 top-5 hidden max-w-[15rem] flex-col gap-2.5 sm:flex">
                                {safeStats.slice(0, 3).map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/85 px-4 py-3 shadow-xl backdrop-blur"
                                    >
                                        <span
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.charge.box}`}
                                        >
                                            <Icon
                                                name={stat.icon}
                                                className="h-5 w-5"
                                            />
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-white">
                                                {stat.value}
                                            </p>
                                            <p className="text-[11px] text-slate-300">
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 p-8">
                            <h2 className="text-2xl font-extrabold tracking-tight text-white">
                                {eyebrow}
                            </h2>
                            <ul className="mt-4 space-y-2.5">
                                {highlights.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-center gap-2.5 text-sm text-indigo-100"
                                    >
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                                            <Icon
                                                name="check"
                                                className="h-3.5 w-3.5"
                                            />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AuthShell;