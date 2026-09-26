const VARIANT_STYLES = {
    primary:
        "qf-btn-shine bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] bg-left hover:bg-right text-white shadow-md shadow-indigo-500/25 focus-visible:outline-indigo-600",
    secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400",
    outline:
        "border border-slate-300 bg-white/80 text-slate-700 hover:border-slate-400 hover:bg-white focus-visible:outline-slate-400",
    danger:
        "qf-btn-shine bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 hover:brightness-110 focus-visible:outline-rose-600",
    ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400"
};

const SIZE_STYLES = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
};

function Button({
    children,
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    className = "",
    ...props
}) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={[
                "group inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
                "transition-all duration-300 ease-out",
                "disabled:cursor-not-allowed disabled:opacity-60",
                "active:scale-[0.98]",
                "hover:-translate-y-0.5",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                VARIANT_STYLES[variant],
                SIZE_STYLES[size],
                className
            ].join(" ")}
            {...props}
        >
            {loading && (
                <span
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                />
            )}
            {children}
        </button>
    );
}

export default Button;