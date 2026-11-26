/**
 * Guards the messaging experience and the chat-specific formatters.
 *
 * The inbox deliberately does more than list conversations: it shows when
 * each thread last moved, groups a thread by day, and tells the sender when
 * their message has been read. Those are easy to drop in a refactor because
 * nothing else in the app depends on them, so they get a static guard here.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    formatMessageDay,
    formatRelativeTime
} from "../src/lib/format.js";

const failures = [];
const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

const read = (...parts) =>
    readFileSync(resolve(process.cwd(), ...parts), "utf8");

console.log("relative inbox timestamps");

const now = new Date(2026, 8, 27, 12, 0, 0);
const minutesAgo = (minutes) =>
    new Date(now.getTime() - minutes * 60 * 1000);

check("a missing timestamp renders nothing", formatRelativeTime("", now) === "");
check("an invalid timestamp renders nothing", formatRelativeTime("not-a-date", now) === "");
check("a fresh message reads 'now'", formatRelativeTime(minutesAgo(0.2), now) === "now");
check("a clock skew into the future still reads 'now'", formatRelativeTime(new Date(now.getTime() + 5000), now) === "now");
check("minutes are compact", formatRelativeTime(minutesAgo(5), now) === "5m");
check("an hour boundary becomes '1h'", formatRelativeTime(minutesAgo(60), now) === "1h");
check(
    "same-day hours stay compact",
    formatRelativeTime(new Date(2026, 8, 27, 9, 0, 0), now) === "3h"
);
check(
    "the previous calendar day reads 'Yesterday'",
    formatRelativeTime(new Date(2026, 8, 26, 23, 30, 0), now) === "Yesterday"
);
const shortDate = (date, year = false) =>
    date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        ...(year ? { year: "numeric" } : {})
    });

check(
    "an older message keeps its day and month",
    formatRelativeTime(new Date(2026, 8, 1, 9, 0, 0), now) ===
        shortDate(new Date(2026, 8, 1)),
    formatRelativeTime(new Date(2026, 8, 1, 9, 0, 0), now)
);
check(
    "a previous year includes the year",
    formatRelativeTime(new Date(2025, 8, 1, 9, 0, 0), now) ===
        shortDate(new Date(2025, 8, 1), true),
    formatRelativeTime(new Date(2025, 8, 1, 9, 0, 0), now)
);

console.log("");
console.log("thread day separators");

check("today's messages group under 'Today'", formatMessageDay(now, now) === "Today");
check(
    "yesterday's messages group under 'Yesterday'",
    formatMessageDay(new Date(2026, 8, 26, 8, 0, 0), now) === "Yesterday"
);
check(
    "older messages use a full date",
    formatMessageDay(new Date(2026, 8, 20, 8, 0, 0), now) ===
        new Date(2026, 8, 20).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
);
check("a missing day renders nothing", formatMessageDay(null, now) === "");
check("an invalid day renders nothing", formatMessageDay("nope", now) === "");

console.log("");
console.log("inbox wiring");

const messages = read("src", "pages", "messages", "Messages.jsx");

check("the inbox can be searched", /aria-label="Search conversations"/.test(messages));
check("search filters the loaded list client-side", /visibleConversations/.test(messages));
check("each row shows a relative timestamp", /formatRelativeTime/.test(messages));
check("threads are grouped by day", /formatMessageDay/.test(messages));
check("the sender sees a read receipt", /message\.is_read[\s\S]{0,80}"Seen"/.test(messages));
check("an unread message reads 'Sent'", /"Sent"/.test(messages));
check("a pending message reads 'Sending'", /Sending…/.test(messages));
check("line breaks in a message survive", /whitespace-pre-wrap/.test(messages));
check("long messages show a character count", /characters/.test(messages));
check("the inbox shows a total unread count", /totalUnread/.test(messages));
check("an empty inbox explains how a thread starts", /once a\s+provider is hired/.test(messages));
check("no matching search explains itself", /No conversations match/.test(messages));

console.log("");
console.log("navigation wiring");

const navbar = read("src", "components", "Navbar.jsx");

check(
    "the account menu links to Messages",
    /ROLE_MESSAGES_PATH/.test(navbar) && /to=\{messagesPath\}/.test(navbar)
);
check(
    "the account menu links to Notifications",
    /ROLE_NOTIFICATIONS_PATH/.test(navbar) &&
        /to=\{notificationsPath\}/.test(navbar)
);
check("unread messages drive a badge", /useUnreadMessages/.test(navbar));
check(
    "unread notifications drive a badge",
    /useUnreadNotifications/.test(navbar)
);
check("badges are clamped for large counts", /99\+/.test(navbar));

console.log(
    failures.length === 0
        ? "\nAll messaging checks passed."
        : `\n${failures.length} check(s) failed.`
);

process.exit(failures.length === 0 ? 0 : 1);
