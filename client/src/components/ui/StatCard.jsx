import Icon from "./Icon";
import AnimatedValue from "../motion/AnimatedValue";

const TONES = {
    indigo: {
        bg: "bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600",
        glow: "from-indigo-400/20"
    },
    violet: {
        bg: "bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-600",
        glow: "from-violet-400/20"
    },
    emerald: {
        bg: "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600",
        glow: "from-emerald-400/20"
    },
    amber: {
        bg: "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600",
        glow: "from-amber-400/20"
    },
    rose: {
        bg: "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-600",
        glow: "from-rose-400/20"
    },
    sky: {
        bg: "bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-600",
        glow: "from-sky-400/20"
    },
    slate: {
        bg: "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600",
        glow: "from-slate-400/20"
    }
};

function StatCard({ icon, label, value, tone = "indigo", hint, className = "" }) {
    const toneStyles = TONES[tone] || TONES.indigo;

    return (
        <div
            className={[
                "qf-lift group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5",
                className
            ].join(" ")}
        >
            <div
                className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${toneStyles.glow} to-transparent blur-xl transition-opacity duration-300`}
                aria-hidden="true"
            />
            <div className="relative flex items-center gap-2.5 sm:gap-3">
                <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-4 ring-slate-50 shadow-sm sm:h-12 sm:w-12 ${toneStyles.bg}`}
                >
                    <Icon name={icon} className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold leading-tight text-slate-500 sm:text-sm">
                        {label}
                    </p>
                    <p className="truncate text-lg font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                        <AnimatedValue value={value} duration={1300} />
                    </p>
                </div>
            </div>
            {hint && (
                <p className="relative mt-2 truncate text-[11px] text-slate-400 sm:text-xs">
                    {hint}
                </p>
            )}
        </div>
    );
}

export default StatCard;
