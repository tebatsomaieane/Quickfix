import Icon from "./Icon";
import AnimatedValue from "../motion/AnimatedValue";

const TONES = {
    indigo: { bg: "bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600", glow: "from-indigo-400/20" },
    violet: { bg: "bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-600", glow: "from-violet-400/20" },
    emerald: { bg: "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600", glow: "from-emerald-400/20" },
    amber: { bg: "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600", glow: "from-amber-400/20" },
    rose: { bg: "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600", glow: "from-rose-400/20" },
    sky: { bg: "bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-600", glow: "from-sky-400/20" },
    slate: { bg: "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600", glow: "from-slate-400/20" }
};

function StatCard({ icon, label, value, tone = "indigo", hint, className = "" }) {
    const toneStyles = TONES[tone] || TONES.indigo;

    return (
        <div
            className={[
                "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
                "transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1),0_4px_16px_rgba(99,102,241,0.12)]",
                className
            ].join(" ")}
        >
            <div
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${toneStyles.glow} to-transparent blur-xl transition-opacity duration-300 group-hover:opacity-200`}
                aria-hidden="true"
            />
            <div className="relative flex items-center gap-3">
                <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-4 ring-slate-50 shadow-sm sm:h-12 sm:w-12 ${toneStyles.bg}`}
                >
                    <Icon name={icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-slate-500 sm:text-sm">
                        {label}
                    </p>
                    <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                        <AnimatedValue value={value} duration={1300} />
                    </p>
                </div>
            </div>
            {hint && (
                <p className="relative mt-2.5 text-xs text-slate-400">{hint}</p>
            )}
        </div>
    );
}

export default StatCard;