import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMyNotifications } from "../services/notificationService";
import { onEvent } from "../services/realtimeService";

// Total unread notification count for the shared nav.
//
// The dashboard layout keeps its own counter while a workspace is open; this
// hook covers the public shell, where a signed-in user can still see that
// something arrived without opening their dashboard. Polling is deliberately
// slower than the message badge - notifications are not a live conversation -
// and skipped entirely while the tab is hidden.
export function useUnreadNotifications(enabled = true) {
    const [unread, setUnread] = useState(0);
    const inFlight = useRef(false);

    const refresh = useCallback(async () => {
        if (!enabled || inFlight.current) {
            return;
        }

        inFlight.current = true;

        try {
            const data = await fetchMyNotifications();
            const notifications = data?.data?.notifications || [];

            setUnread(
                notifications.reduce(
                    (total, notification) =>
                        total + (notification.is_read ? 0 : 1),
                    0
                )
            );
        } catch {
            // badge is non-critical; the next tick retries
        } finally {
            inFlight.current = false;
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            setUnread(0);

            return undefined;
        }

        let stopped = false;
        let debounce = null;

        const tick = () => {
            if (!document.hidden) {
                refresh();
            }
        };

        tick();

        const timer = setInterval(tick, 60000);

        const onVisible = () => {
            if (!document.hidden) {
                refresh();
            }
        };

        document.addEventListener("visibilitychange", onVisible);

        const unsubscribe = onEvent("notification", () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                if (!stopped) {
                    refresh();
                }
            }, 600);
        });

        return () => {
            stopped = true;
            clearTimeout(debounce);
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            unsubscribe();
        };
    }, [enabled, refresh]);

    return { unread, refresh };
}

export default useUnreadNotifications;
