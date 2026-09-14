function Input({
    label,
    id,
    type = "text",
    error,
    hint,
    className = "",
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={id}
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                    {label}
                </label>
            )}

            <input
                id={id}
                type={type}
                className={[
                    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900",
                    "placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2",
                    error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100",
                    className
                ].join(" ")}
                {...props}
            />

            {error ? (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            ) : hint ? (
                <p className="mt-1 text-sm text-slate-500">{hint}</p>
            ) : null}
        </div>
    );
}

export default Input;