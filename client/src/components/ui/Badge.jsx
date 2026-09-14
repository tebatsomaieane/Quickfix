const COLOR_STYLES = {
    green: "bg-green-50 text-green-700 ring-green-600/20",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
};

function Badge({ children, color = "gray", className = "" }) {
    return (
        <span
            className={[
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                COLOR_STYLES[color],
                className
            ].join(" ")}
        >
            {children}
        </span>
    );
}

export default Badge;