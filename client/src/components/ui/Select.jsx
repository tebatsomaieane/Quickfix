import { fieldClasses, useFieldA11y } from "./Input";

function Select({
    label,
    id,
    error,
    hint,
    options = [],
    placeholder = "Select an option",
    className = "",
    required,
    ...props
}) {
    const a11y = useFieldA11y(id, { error, hint, required });

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={a11y.fieldId}
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                    {label}
                    {required && (
                        <span
                            className="ml-0.5 text-rose-500"
                            aria-hidden="true"
                        >
                            *
                        </span>
                    )}
                </label>
            )}

            <div className="relative">
                <select
                    id={a11y.fieldId}
                    className={[
                        fieldClasses(error, className),
                        "cursor-pointer appearance-none pr-10",
                        props.value === "" || props.value == null
                            ? "text-slate-400"
                            : "text-slate-900"
                    ].join(" ")}
                    aria-invalid={a11y.invalid}
                    aria-describedby={a11y.describedBy}
                    required={a11y.required}
                    {...props}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => {
                        const value =
                            typeof option === "object" ? option.value : option;
                        const label =
                            typeof option === "object" ? option.label : option;

                        return (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        );
                    })}
                </select>
                <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>

            {error ? (
                <p
                    id={a11y.messageId}
                    role="alert"
                    className="mt-1 text-sm text-red-600"
                >
                    {error}
                </p>
            ) : hint ? (
                <p
                    id={a11y.messageId}
                    className="mt-1 text-sm text-slate-500"
                >
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export default Select;