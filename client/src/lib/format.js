/**
 * Formats a Lesotho loti amount, e.g. 1234.5 -> "M1,234.50".
 *
 * `toFixed` on its own would render 12345 as "M12345.00", which is hard to read
 * at a glance for the larger job totals that quotes produce. Non-numeric input
 * returns an empty string rather than "MNaN".
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
        return "";
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "";
    }

    const [whole, decimals] = Math.abs(amount)
        .toFixed(2)
        .split(".");

    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return `${amount < 0 ? "-" : ""}M${grouped}.${decimals}`;
};

// A bare `YYYY-MM-DD` is parsed by the Date constructor as UTC midnight, which
// renders as the previous day for anyone west of UTC. Treating it as a local
// calendar date keeps the day the user actually entered.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const toLocalDate = (dateString) => {
    if (DATE_ONLY.test(dateString)) {
        const [year, month, day] = dateString.split("-").map(Number);

        return new Date(year, month - 1, day);
    }

    return new Date(dateString);
};

export const formatDate = (dateString) => {
    if (!dateString) {
        return "";
    }

    const date = toLocalDate(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) {
        return "";
    }

    const date = toLocalDate(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const startOfLocalDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const DAY_MS = 24 * 60 * 60 * 1000;

// A compact timestamp for inbox rows: "now", "5m", "3h", "Yesterday",
// "27 Sep", "27 Sep 2025". Falls back to an empty string rather than
// rendering "Invalid Date" beside a conversation.
export const formatRelativeTime = (dateString, now = new Date()) => {
    if (!dateString) {
        return "";
    }

    const date = toLocalDate(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) {
        return "now";
    }

    if (diff < 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 1000))}m`;
    }

    const today = startOfLocalDay(now);
    const day = startOfLocalDay(date);

    if (day === today) {
        return `${Math.floor(diff / (60 * 60 * 1000))}h`;
    }

    if (today - day === DAY_MS) {
        return "Yesterday";
    }

    const sameYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        ...(sameYear ? {} : { year: "numeric" })
    });
};

// The label above a group of messages from the same calendar day.
export const formatMessageDay = (dateString, now = new Date()) => {
    if (!dateString) {
        return "";
    }

    const date = toLocalDate(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const today = startOfLocalDay(now);
    const day = startOfLocalDay(date);

    if (day === today) {
        return "Today";
    }

    if (today - day === DAY_MS) {
        return "Yesterday";
    }

    return formatDate(dateString);
};

// Map a database status to a Tailwind badge color
export const statusColor = (status) => {
    const map = {
        PENDING: "amber",
        OPEN: "blue",
        OFFERS_RECEIVED: "indigo",
        PROVIDER_SELECTED: "blue",
        IN_PROGRESS: "blue",
        COMPLETED: "green",
        CANCELLED: "red",
        ACCEPTED: "green",
        REJECTED: "red",
        WITHDRAWN: "gray",
        EXPIRED: "gray",
        ASSIGNED: "amber",
        DISPUTED: "red",
        APPROVED: "green",
        UNDER_REVIEW: "amber",
        ACTIVE: "green",
        INACTIVE: "gray"
    };

    return map[status] || "gray";
};

export const statusLabel = (status) =>
    (status || "").replace(/_/g, " ").toLowerCase();