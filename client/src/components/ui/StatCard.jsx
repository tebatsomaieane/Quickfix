import Icon from "./Icon";

const TONES = {
    indigo: { bg: "bg-indigo-50 text-indigo-600", ring: "group-hover:ring-indigo-100" },
    violet: { bg: "bg-violet-50 text-violet-600", ring: "group-hover:ring-violet-100" },
    emerald: { bg: "bg-emerald-50 text-emerald-600", ring: "group-hover:ring-emerald-100" },
    amber: { bg: "bg-amber-50 text-amber-600", ring: "group-hover:ring-amber-100" },
    rose: { bg: "bg-rose-50 text-rose-600", ring: "group-hover:ring-rose-100" },
    sky: { bg: "bg-sky-50 text-sky-600", ring: "group-hover:ring-sky-100" },
    slate: { bg: "bg-slate-100 text-slate-600", ring: "group-hover:ring-slate-200" }
};

function StatCard({ icon, label, value, tone = "indigo", hint, className = "" }) {
    const toneStyles = TONES[tone] || TONES.indigo;

    return (
        <div
            className={[
                "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
                "transition hover:shadow-md hover:-translate-y-0.5",
                className
            ].join(" ")}
        >
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.06] transition group-hover:opacity-10"
                style={{ background: "radial-gradient(circle, currentColor 0%, transparent 70%)" }}
            />
            <div className="flex items-center gap-3">
                <span
                    className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-4 ring-transparent transition",
                        toneStyles.bg,
                        toneStyles.ring
                    ].join(" ")}
                >
                    <Icon name={icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-500">
                        {label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>
                </div>
            </div>
            {hint && (
                <p className="mt-2 text-xs text-slate-400">{hint}</p>
            )}
        </div>
    );
}

export default StatCard;