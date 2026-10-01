import { fieldClasses, useFieldA11y } from "./Input";

function Textarea({
    label,
    id,
    rows = 4,
    error,
    hint,
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

            <textarea
                id={a11y.fieldId}
                rows={rows}
                className={fieldClasses(error, className)}
                aria-invalid={a11y.invalid}
                aria-describedby={a11y.describedBy}
                required={a11y.required}
                {...props}
            />

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

export default Textarea;
