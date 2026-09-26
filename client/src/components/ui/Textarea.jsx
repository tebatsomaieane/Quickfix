import { fieldClasses } from "./Input";

function Textarea({
    label,
    id,
    rows = 4,
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

            <textarea
                id={id}
                rows={rows}
                className={fieldClasses(error, className)}
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

export default Textarea;