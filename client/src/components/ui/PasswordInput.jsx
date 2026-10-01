import { useState } from "react";
import { useFieldA11y, fieldClasses } from "./Input";
import PasswordStrength from "./PasswordStrength";

/**
 * Password field with a reveal toggle and an optional strength meter.
 *
 * Two details matter here. The toggle carries `type="button"` so clicking it
 * cannot submit the surrounding form, and it keeps the field's real id
 * (rather than being a separate control) so focus and validation still target
 * the input. `aria-pressed` communicates the toggle state to a screen reader,
 * which otherwise has no way to tell a shown password from a hidden one.
 */
function PasswordInput({
    label,
    id,
    error,
    hint,
    className = "",
    required,
    showStrength = false,
    strengthId,
    ...props
}) {
    const [revealed, setRevealed] = useState(false);
    const a11y = useFieldA11y(id, { error, hint, required });

    // One describedby target for whichever message is showing, plus the meter
    // when present, so the field reads its hint and requirements in order.
    const describedBy = [a11y.messageId, showStrength ? strengthId : null]
        .filter(Boolean)
        .join(" ")
        .trim();

    const toggleId = `${a11y.fieldId}-reveal`;

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

            <div className="relative">
                <input
                    {...props}
                    id={a11y.fieldId}
                    type={revealed ? "text" : "password"}
                    aria-invalid={a11y.invalid}
                    aria-describedby={describedBy || undefined}
                    required={a11y.required}
                    className={fieldClasses(
                        error,
                        `pr-16 ${className}`
                    )}
                />

                <button
                    type="button"
                    id={toggleId}
                    onClick={() => setRevealed((value) => !value)}
                    aria-pressed={revealed}
                    aria-label={revealed ? "Hide password" : "Show password"}
                    aria-controls={a11y.fieldId}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                    {revealed ? "Hide" : "Show"}
                </button>
            </div>

            {error ? (
                <p
                    id={a11y.messageId}
                    role="alert"
                    className="mt-1.5 text-sm font-medium text-red-600"
                >
                    {error}
                </p>
            ) : hint ? (
                <p
                    id={a11y.messageId}
                    className="mt-1.5 text-sm text-slate-500"
                >
                    {hint}
                </p>
            ) : null}

            {showStrength && (
                <PasswordStrength
                    id={strengthId}
                    value={props.value}
                />
            )}
        </div>
    );
}

export default PasswordInput;
