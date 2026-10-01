import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { onApiUnreachable, onApiReachable } from "../../lib/connectivity";

/**
 * App-wide connectivity notice.
 *
 * Every data page treats a failed request the same as an empty result, so with
 * the radio off — or the API briefly unreachable — the user was shown calm
 * "nothing here yet" empty states and had no way to tell that the real problem
 * was the connection. This surfaces that state once, everywhere, instead of
 * leaving every page to rediscover it on its own.
 *
 * Two independent signals:
 *   - the browser reports no connection (airplane mode, no signal)
 *   - the device is online but an API request never got a response
 *
 * The second is what catches an API that is asleep or down while the user's
 * own connection is fine, which is the more confusing case of the two.
 *
 * Rendered outside the router's ErrorBoundary so a crashed page cannot take
 * the explanation down with it.
 */
export default function ConnectionBanner() {
    const [offline, setOffline] = useState(
        () => typeof navigator !== "undefined" && !navigator.onLine
    );
    const [apiDown, setApiDown] = useState(false);
    const [restored, setRestored] = useState(false);
    const wasBroken = useRef(false);

    useEffect(() => {
        const goOnline = () => setOffline(false);
        const goOffline = () => setOffline(true);

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);

        const stopDown = onApiUnreachable(() => setApiDown(true));
        const stopOk = onApiReachable(() => setApiDown(false));

        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
            stopDown();
            stopOk();
        };
    }, []);

    const problem = offline || apiDown;

    // A problem that clears becomes a short confirmation, so the banner does
    // not simply vanish and leave the user unsure whether it worked.
    useEffect(() => {
        if (problem) {
            wasBroken.current = true;
            return undefined;
        }

        if (!wasBroken.current) {
            return undefined;
        }

        wasBroken.current = false;
        setRestored(true);

        const timer = setTimeout(() => setRestored(false), 3200);

        return () => clearTimeout(timer);
    }, [problem]);

    if (!problem && !restored) {
        return null;
    }

    const shell =
        "qf-fade-in-fast pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-3 pt-[max(env(safe-area-inset-top),0.5rem)]";

    if (problem) {
        return (
            <div role="status" aria-live="polite" className={shell}>
                <div className="pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl border border-amber-300/70 bg-amber-50/95 px-4 py-3 text-amber-900 shadow-lg shadow-amber-900/10 backdrop-blur-xl">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-200/70 text-amber-700">
                        <Icon name="alert" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                            {offline
                                ? "You're offline"
                                : "Can't reach QuickFix"}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
                            {offline
                                ? "Check your connection and try again. Anything you've typed is kept."
                                : "Our servers aren't responding right now. This one's on us — please try again in a moment."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div role="status" aria-live="polite" className={shell}>
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-50/95 px-4 py-2 text-emerald-800 shadow-lg shadow-emerald-900/10 backdrop-blur-xl">
                <Icon name="checkBadge" className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-bold">Back online</p>
            </div>
        </div>
    );
}
