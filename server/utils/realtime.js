// QuickFix real-time event bus (Server-Sent Events).
//
// Controllers push lightweight events keyed by user id; each user's open
// EventSource receives them as a stream while the underlying data still
// lives in the database (the source of truth). The client treats these
// events as "something changed, refetch" signals, so a dropped or missing
// stream degrades gracefully back to the existing polling.
//
// NOTE: this bus is in-memory and per-process. A single Railway instance
// works as-is; with multiple instances you would swap this for Redis
// pub/sub. Clients keep polling as a safety net either way.

const clients = new Map();
const HEARTBEAT_MS = 25000;

const sseHeaders = (res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();
};

const writeEvent = (res, event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Unsubscribe a response from a user's set.
const unsubscribe = (userId, res) => {
    const set = clients.get(userId);

    if (!set) {
        return;
    }

    set.delete(res);

    if (set.size === 0) {
        clients.delete(userId);
    }
};

// Subscribe a user's SSE response to push events. Returns a cleanup fn.
const subscribe = (userId, res) => {
    if (!clients.has(userId)) {
        clients.set(userId, new Set());
    }

    clients.get(userId).add(res);

    // Send a ready event so the client knows the stream is live.
    writeEvent(res, "ready", { at: new Date().toISOString() });

    const heartbeat = setInterval(() => {
        res.write(": ping\n\n");
    }, HEARTBEAT_MS);

    const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe(userId, res);
    };

    res.on("close", cleanup);

    return cleanup;
};

// Push an event to a single user's open streams. Errors are swallowed - a
// stale/broken socket must never break the caller's flow.
const pushToUser = (userId, event, payload) => {
    if (!userId || !clients.has(userId)) {
        return;
    }

    try {
        const set = clients.get(userId);

        for (const res of set) {
            writeEvent(res, event, payload);
        }
    } catch {
        // Best-effort push only.
    }
};

// Message sent in a conversation: notify both participants.
const pushConversation = (userId, conversationId, message) => {
    pushToUser(userId, "conversation", {
        conversationId,
        message
    });
};

module.exports = {
    sseHeaders,
    subscribe,
    pushToUser,
    pushConversation
};