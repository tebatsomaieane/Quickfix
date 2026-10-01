/**
 * Reachability signal shared between the API client and the UI.
 *
 * This lives in `lib` rather than in the banner component because `services/`
 * must not depend on `components/`, and because the event names are a contract
 * between those two layers rather than a piece of the banner's internals.
 */

const API_DOWN_EVENT = "qf:api-unreachable";
const API_OK_EVENT = "qf:api-reachable";

/** The request never completed: offline, DNS failure, or the API asleep. */
export function reportApiUnreachable() {
    window.dispatchEvent(new CustomEvent(API_DOWN_EVENT));
}

/** The API answered, so it is up again. */
export function reportApiReachable() {
    window.dispatchEvent(new CustomEvent(API_OK_EVENT));
}

export function onApiUnreachable(handler) {
    window.addEventListener(API_DOWN_EVENT, handler);

    return () => window.removeEventListener(API_DOWN_EVENT, handler);
}

export function onApiReachable(handler) {
    window.addEventListener(API_OK_EVENT, handler);

    return () => window.removeEventListener(API_OK_EVENT, handler);
}
