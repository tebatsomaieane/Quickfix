const VARIANT_STYLES = {
    primary:
        "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600",
    secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400",
    outline:
        "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400",
    danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
    ghost:
        "bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400"
};

const SIZE_STYLES = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
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
                "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
                "transition-colors duration-150",
                "disabled:cursor-not-allowed disabled:opacity-60",
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