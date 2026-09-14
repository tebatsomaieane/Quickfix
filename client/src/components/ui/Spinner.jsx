function Spinner({ className = "" }) {
    return (
        <span
            role="status"
            aria-label="Loading"
            className={[
                "inline-block animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600",
                "h-8 w-8",
                className
            ].join(" ")}
        />
    );
}

export default Spinner;