const COLOR_STYLES = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-rose-50 text-rose-700 ring-rose-600/20",
    gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
};

function Badge({ children, color = "gray", className = "" }) {
    return (
        <span
            className={[
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                COLOR_STYLES[color],
                className
            ].join(" ")}
        >
            {children}
        </span>
    );
}

export default Badge;