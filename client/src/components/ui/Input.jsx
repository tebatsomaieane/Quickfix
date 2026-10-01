/* eslint-disable react-refresh/only-export-components -- shares fieldClasses helper with Select/Textarea */
import { useId } from "react";

const FIELD_CLASSES = [
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm",
    "placeholder:text-slate-400",
    "transition focus:outline-none focus:ring-4",
    "hover:border-slate-400"
].join(" ");

const FIELD_TONE = (error) =>
    error
        ? "border-red-400 focus:border-red-500 focus:ring-red-100/70"
        : "border-slate-300 focus:indigo-500 focus:ring-indigo-100 focus:border-indigo-500";

export function fieldClasses(error, extra = "") {
    return [FIELD_CLASSES, FIELD_TONE(error), extra].join(" ");
}

/**
 * Wires up the ids that make a field accessible.
 *
 * Most call sites never passed an `id`, which left their `<label>` orphaned —
 * clicking it did nothing and a screen reader had no name for the control. We
 * derive a stable id instead, then point `aria-invalid` and `aria-describedby`
 * at the visible error/hint so the message is announced rather than merely
 * drawn.
 */
export function useFieldA11y(id, { error, hint, required } = {}) {
    const generated = useId();
    const fieldId = id || generated;
    const message = error || hint || null;
    const messageId = message ? `${fieldId}-msg` : undefined;

    return {
        fieldId,
        messageId,
        describedBy: messageId,
        invalid: error ? true : undefined,
        required: required || undefined
    };
}

function Input({ label, id, error, hint, className = "", required, ...props }) {
    const a11y = useFieldA11y(id, { error, hint, required });

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={a11y.fieldId}
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
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

            <input
                id={a11y.fieldId}
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
                    className="mt-1.5 text-sm font-medium text-red-600"
                >
                    {error}
                </p>
            ) : hint ? (
                <p id={a11y.messageId} className="mt-1.5 text-sm text-slate-500">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export default Input;
