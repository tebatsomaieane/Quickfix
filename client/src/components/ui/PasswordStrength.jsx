/* eslint-disable react-refresh/only-export-components -- scorePassword is a pure helper reused by tests and by PasswordInput call sites */
import { useMemo } from "react";

/**
 * Password strength meter with a live checklist.
 *
 * A single "Must be at least 6 characters" hint is easy to skim past and
 * impossible to act on. Showing exactly which requirements are still unmet --
 * and ticking them off as the user types -- turns an opaque rule into an
 * obvious next action, which is most of the difference between a user who
 * guesses repeatedly and one who gets it right the first time.
 */

const LEVELS = [
    { label: "Too short", bar: "w-1/4", color: "bg-rose-500", text: "text-rose-600" },
    { label: "Weak", bar: "w-1/4", color: "bg-rose-500", text: "text-rose-600" },
    { label: "Fair", bar: "w-2/4", color: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", bar: "w-3/4", color: "bg-lime-500", text: "text-lime-600" },
    { label: "Strong", bar: "w-full", color: "bg-emerald-500", text: "text-emerald-600" }
];

export const MIN_PASSWORD_LENGTH = 8;

export function scorePassword(value) {
    const password = value || "";

    if (password.length === 0) {
        return { level: -1, checks: [] };
    }

    const checks = [
        {
            id: "length",
            label: `At least ${MIN_PASSWORD_LENGTH} characters`,
            met: password.length >= MIN_PASSWORD_LENGTH
        },
        {
            id: "letter",
            label: "Contains a letter",
            met: /[A-Za-z]/.test(password)
        },
        {
            id: "number",
            label: "Contains a number",
            met: /\d/.test(password)
        }
    ];

    const met = checks.filter((check) => check.met).length;

    if (password.length < MIN_PASSWORD_LENGTH) {
        return { level: password.length > 0 ? 0 : -1, checks };
    }

    // 1 = all requirements met, 2 adds a symbol, 3 adds extra length.
    let level = met === checks.length ? 3 : met === 2 ? 2 : 1;

    if (level === 3 && password.length >= 12) {
        level = 4;
    }

    if (level === 3 && /[^A-Za-z0-9]/.test(password)) {
        level = 4;
    }

    return { level, checks };
}

export default function PasswordStrength({ value, id }) {
    const { level, checks } = useMemo(() => scorePassword(value), [value]);

    if (!value) {
        return null;
    }

    const current = LEVELS[Math.max(level, 0)];

    return (
        <div className="mt-2" id={id}>
            {/* The bar is decorative; the checklist below carries the meaning. */}
            <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
                aria-hidden="true"
            >
                <div
                    className={`h-full rounded-full ${current.color} ${current.bar} transition-all duration-300`}
                />
            </div>

            <p className={`mt-1.5 text-xs font-bold ${current.text}`}>
                {current.label}
            </p>

            <ul className="mt-1.5 space-y-0.5">
                {checks.map((check) => (
                    <li
                        key={check.id}
                        className={`flex items-center gap-1.5 text-xs ${
                            check.met ? "text-emerald-600" : "text-slate-500"
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                check.met
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-200 text-slate-500"
                            }`}
                        >
                            {check.met ? "✓" : ""}
                        </span>
                        <span>{check.label}</span>
                        <span className="sr-only">
                            {check.met ? " — met" : " — not met yet"}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
