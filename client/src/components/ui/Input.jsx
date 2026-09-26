/* eslint-disable react-refresh/only-export-components -- shares fieldClasses helper with Select/Textarea */
const FIELD_CLASSES = [
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm",
    "placeholder:text-slate-400",
    "transition focus:outline-none focus:ring-4",
    "hover:border-slate-400"
].join(" ");

const FIELD_TONE = (error) =>
    error
        ? "border-red-400 focus:border-red-500 focus:ring-red-100/70"
        : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100";

export function fieldClasses(error, extra = "") {
    return [FIELD_CLASSES, FIELD_TONE(error), extra].join(" ");
}

function Input({ label, id, error, hint, className = "", ...props }) {
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

export default Input;