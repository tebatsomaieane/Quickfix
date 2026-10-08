import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";

const STORAGE_KEY = "qf_cookie_consent";
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;
const SETTINGS_EVENT = "qf:cookie-settings";

/**
 * Cookie notice shown until the visitor makes a choice.
 *
 * QuickFix only stores strictly-necessary items plus an optional preference
 * flag, so this is deliberately a two-button notice rather than a wall of
 * toggles — asking for consent over cookies that cannot be refused is a dark
 * pattern. The choice itself is remembered for 12 months so the banner does
 * not nag on every visit, and the footer's "Cookie settings" link reopens it
 * through a window event rather than keeping global state in a context.
 */
function readConsent() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw);

        if (typeof parsed?.decidedAt !== "number") {
            return null;
        }

        if (Date.now() - parsed.decidedAt > TWELVE_MONTHS_MS) {
            window.localStorage.removeItem(STORAGE_KEY);

            return null;
        }

        return parsed;
    } catch {
        // A blocked or full storage must not break the page, and must not
        // leave a banner that can never be dismissed either.
        return null;
    }
}

function writeConsent(preferences) {
    const value = {
        necessary: true,
        preferences,
        decidedAt: Date.now()
    };

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        /* storage unavailable; the banner simply reappears next visit */
    }

    return value;
}

function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState(true);

    useEffect(() => {
        const existing = readConsent();

        if (existing) {
            setPreferences(Boolean(existing.preferences));
        } else {
            setVisible(true);
        }

        const reopen = () => {
            setVisible(true);
            setShowSettings(true);
        };

        window.addEventListener(SETTINGS_EVENT, reopen);

        return () => window.removeEventListener(SETTINGS_EVENT, reopen);
    }, []);

    const decide = (allowPreferences) => {
        writeConsent(allowPreferences);

        setPreferences(allowPreferences);
        setVisible(false);
        setShowSettings(false);
    };

    if (!visible) {
        return null;
    }

    return (
        <div
            role="region"
            aria-label="Cookie notice"
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6"
        >
            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Icon name="layers" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-slate-900">
                            We use a few cookies
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            QuickFix uses strictly necessary cookies to keep
                            you signed in and to protect forms from forgery —
                            the site cannot work without them. With your
                            permission we also remember your preferences. We
                            run no advertising or analytics trackers.{" "}
                            <Link
                                to="/cookies"
                                className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Read the Cookie Policy
                            </Link>
                        </p>
                    </div>
                </div>

                {showSettings && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <h3 className="font-bold text-slate-800">
                            Cookie settings
                        </h3>
                        <label className="mt-3 flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked
                                disabled
                                className="mt-0.5 h-4 w-4 accent-indigo-600"
                            />
                            <span>
                                <span className="font-semibold text-slate-800">
                                    Strictly necessary
                                </span>{" "}
                                <span className="text-slate-500">
                                    — sign-in, security and your cookie choice.
                                    Always on.
                                </span>
                            </span>
                        </label>
                        <label className="mt-3 flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                name="cookie-preferences"
                                checked={preferences}
                                onChange={(event) =>
                                    setPreferences(event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 accent-indigo-600"
                            />
                            <span>
                                <span className="font-semibold text-slate-800">
                                    Preferences
                                </span>{" "}
                                <span className="text-slate-500">
                                    — remembers choices you make in the app so
                                    you are not asked twice. Optional.
                                </span>
                            </span>
                        </label>
                        <p className="mt-3 text-xs text-slate-500">
                            No analytics or advertising cookies are used. See
                            the full list on the{" "}
                            <Link
                                to="/cookies"
                                className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Cookie Policy
                            </Link>
                            .
                        </p>
                    </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={() => setShowSettings((open) => !open)}
                        aria-expanded={showSettings}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        {showSettings ? "Hide settings" : "Cookie settings"}
                    </button>
                    <button
                        type="button"
                        onClick={() => decide(false)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        Necessary only
                    </button>
                    <button
                        type="button"
                        onClick={() => decide(preferences)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        {showSettings ? "Save preferences" : "Accept all"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CookieConsent;
