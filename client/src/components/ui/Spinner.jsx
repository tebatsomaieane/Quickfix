function Spinner({ className = "" }) {
    return (
        <span
            role="status"
            aria-label="Loading"
            className={[
                "inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200",
                "border-t-indigo-600 shadow-sm",
                className
            ].join(" ")}
        />
    );
}

export default Spinner;