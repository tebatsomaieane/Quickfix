import { getApiBaseUrl } from "./api";

// Single shared Server-Sent Events stream for the logged-in user.
//
// Events are lightweight "something changed" hints - the payload never
// carries sensitive data. Listeners refetch from the regular REST API on
// receipt, so a missing/closed stream (backend not yet updated, network
// blip) simply means the app keeps its previous polling behaviour.
//
// EventSource reconnects automatically; we also expose closeStream() for
// the logout path.

let source = null;
const listeners = new Map();

const emit = (type, payload) => {
    const handlers = listeners.get(type);

    if (!handlers) {
        return;
    }

    handlers.forEach((handler) => {
        try {
            handler(payload);
        } catch {
            // never let a listener break the stream
        }
    });
};

const connect = () => {
    if (source) {
        return source;
    }

    const url = `${getApiBaseUrl()}/events`;

    try {
        source = new EventSource(url, { withCredentials: true });
    } catch {
        source = null;

        return null;
    }

    source.onerror = () => {
        // EventSource reconnects on its own. Polling remains the fallback
        // while the stream is down.
    };

    const types = ["ready", "notification", "conversation"];

    types.forEach((type) => {
        source.addEventListener(type, (event) => {
            let payload;

            try {
                payload = JSON.parse(event.data);
            } catch {
                payload = null;
            }

            emit(type, payload);
        });
    });

    return source;
};

// Subscribe to a stream event. Returns an unsubscribe function.
export const onEvent = (type, handler) => {
    connect();

    if (!listeners.has(type)) {
        listeners.set(type, new Set());
    }

    listeners.get(type).add(handler);

    return () => {
        listeners.get(type)?.delete(handler);
    };
};

// Drop the stream (used on logout).
export const closeStream = () => {
    if (source) {
        source.close();
        source = null;
    }
};

// Whether the stream is currently connected (for UI hints/debug).
export const isStreamConnected = () =>
    source !== null && source.readyState === EventSource.OPEN;