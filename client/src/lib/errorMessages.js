/**
 * The one place that decides what a failed request is allowed to say.
 *
 * Before this existed, every catch block in the app either showed a generic
 * "Something went wrong" or passed a raw server string straight through --
 * which regularly meant leaking internal wording like "Failed to update
 * provider_services" to a customer, or showing "Network Error" when the real
 * problem was a phone that had lost signal.
 *
 * The rules encoded here are the ones that actually help someone:
 *   - say what happened in terms they caused or can fix;
 *   - if we know why, give the reason;
 *   - if the request is worth repeating, say so and offer it;
 *   - never surface an internal identifier or a stack trace.
 */

/** Patterns are matched in order, so specific cases come first. */
const NETWORK_PATTERN =
    /network\s*error|failed to fetch|network request failed|load failed|err_(connection|network|name|internet)/i;

const OFFLINE_PATTERN = /offline|no internet|internet connection/i;

const TIMEOUT_PATTERN = /timeout|timed out|etimedout|deadline exceeded/i;

const AUTH_PATTERN = /invalid email or password|incorrect password|unauthorized/i;

/**
 * Human-facing explanations for server codes. Anything not listed falls back to
 * a generic but honest message rather than exposing the code.
 */
const STATUS_MESSAGES = {
    400: "That request was incomplete. Please check the highlighted fields and try again.",
    401: "Your session has expired. Please sign in again.",
    403: "You don't have permission to do that.",
    404: "We couldn't find what you were looking for.",
    409: "That conflicts with something that already exists.",
    413: "That file is too large. Please choose a smaller one.",
    422: "Some of the details provided aren't valid.",
    429: "Too many attempts. Please wait a moment and try again.",
    500: "Something went wrong on our end. Please try again in a moment.",
    502: "Our servers are briefly unavailable. Please try again.",
    503: "Our service is briefly down for maintenance. Please try again shortly.",
    504: "That took too long to process. Please try again."
};

/**
 * @param {unknown} error An Axios error, or anything thrown by a fetch call.
 * @param {object} [options]
 * @param {boolean} [options.isAuth] The request was an auth attempt, where
 *        naming the specific reason is safe and expected.
 * @param {string} [options.fallback] Context-specific default message.
 * @returns {{ title: string, detail?: string, retryable: boolean, kind: string }}
 */
export function describeError(error, options = {}) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message || "";
    const isNetwork = !error?.response && NETWORK_PATTERN.test(String(error?.message || ""));
    const isOffline =
        OFFLINE_PATTERN.test(serverMessage) ||
        (typeof navigator !== "undefined" && navigator.onLine === false);

    if (isOffline) {
        return {
            kind: "offline",
            title: "You appear to be offline",
            detail: "Reconnect and try again — nothing was lost.",
            retryable: true
        };
    }

    if (isNetwork) {
        return {
            kind: "network",
            title: "Can't reach QuickFix",
            detail:
                "Check your connection and try again. Your work is still here.",
            retryable: true
        };
    }

    if (TIMEOUT_PATTERN.test(String(error?.message || "")) || status === 504) {
        return {
            kind: "timeout",
            title: "That took too long",
            detail: "The request timed out. Please try again.",
            retryable: true
        };
    }

    // A 401 carries two very different meanings. On a sign-in attempt it means
    // the credentials were wrong, which the user needs to know precisely; on
    // any other request it means the session died and they need to sign in
    // again. Checking the message first keeps "session expired" from being
    // shown to someone who simply mistyped their password.
    if (status === 401) {
        if (AUTH_PATTERN.test(serverMessage)) {
            return {
                kind: "credentials",
                title: "Email or password is incorrect",
                detail: "Please check and try again.",
                retryable: false
            };
        }

        return {
            kind: "auth",
            title: "Your session has expired",
            detail: "Please sign in again to continue.",
            retryable: false
        };
    }

    if (status === 403) {
        return {
            kind: "forbidden",
            title: "You don't have access to that",
            detail:
                "If you think this is wrong, check that you're signed in with the right account.",
            retryable: false
        };
    }

    if (status === 413) {
        return {
            kind: "upload",
            title: "That file is too large",
            detail: "Please choose a smaller file and try again.",
            retryable: false
        };
    }

    if (status === 429) {
        return {
            kind: "rate",
            title: "Too many attempts",
            detail: "Please wait a little before trying again.",
            retryable: true
        };
    }

    // A validation rejection is not a failure to report as a headline; it is
    // already being shown on the field that caused it.
    if (status === 400 || status === 422) {
        return {
            kind: "validation",
            title: "",
            detail: serverMessage,
            retryable: false
        };
    }

    if (status === 404) {
        return {
            kind: "missing",
            title: STATUS_MESSAGES[404],
            retryable: false
        };
    }

    if (status >= 500) {
        return {
            kind: "server",
            title: STATUS_MESSAGES[status] || STATUS_MESSAGES[500],
            detail: "If this keeps happening, please contact support.",
            retryable: true
        };
    }

    // No status and no recognisable network error: still offline, most likely.
    if (!status) {
        return {
            kind: "network",
            title: "Can't reach QuickFix",
            detail: "Check your connection and try again.",
            retryable: true
        };
    }

    return {
        kind: "unknown",
        title:
            STATUS_MESSAGES[status] ||
            options.fallback ||
            "Something went wrong. Please try again.",
        retryable: true
    };
}

/**
 * Convenience for the common `catch` block: a toast-ready object.
 *
 * @param {unknown} error
 * @param {object} [options] See {@link describeError}. `retry` adds an action
 *        to the toast that re-runs the failed call.
 */
export function errorToast(error, options = {}) {
    const described = describeError(error, options);

    return {
        title: described.title,
        detail: described.detail,
        retryable: described.retryable,
        action: options.retry
            ? { label: "Try again", onClick: options.retry }
            : undefined
    };
}
