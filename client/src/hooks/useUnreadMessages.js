import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMyConversations } from "../services/conversationService";
import { onEvent } from "../services/realtimeService";

// Total unread message count across every conversation, kept fresh enough to
// drive the nav badge without hammering the API:
//
//   - a single lightweight list fetch every 45s, skipped while the tab is
//     hidden (a background tab has nobody looking at a badge);
//   - an immediate refresh on the real-time "conversation" hint, debounced so
//     a burst of messages produces one fetch, not one per message.
export function useUnreadMessages(enabled = true) {
    const [unread, setUnread] = useState(0);
    const inFlight = useRef(false);

    const refresh = useCallback(async () => {
        if (!enabled || inFlight.current) {
            return;
        }

        inFlight.current = true;

        try {
            const data = await fetchMyConversations();
            const conversations = data?.data?.conversations || [];

            setUnread(
                conversations.reduce(
                    (total, conversation) =>
                        total + (Number(conversation.unread_count) || 0),
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

        const timer = setInterval(tick, 45000);

        const onVisible = () => {
            if (!document.hidden) {
                refresh();
            }
        };

        document.addEventListener("visibilitychange", onVisible);

        const unsubscribe = onEvent("conversation", () => {
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

export default useUnreadMessages;
