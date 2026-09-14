function Select({
    label,
    id,
    error,
    hint,
    options = [],
    placeholder = "Select an option",
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

            <select
                id={id}
                className={[
                    "w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900",
                    "focus:outline-none focus:ring-2",
                    error
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100",
                    className
                ].join(" ")}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => {
                    const value = typeof option === "object"
                        ? option.value
                        : option;
                    const label = typeof option === "object"
                        ? option.label
                        : option;

                    return (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    );
                })}
            </select>

            {error ? (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            ) : hint ? (
                <p className="mt-1 text-sm text-slate-500">{hint}</p>
            ) : null}
        </div>
    );
}

export default Select;