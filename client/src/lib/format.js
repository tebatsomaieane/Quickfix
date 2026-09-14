export const formatCurrency = (value) =>
    value === null || value === undefined
        ? ""
        : `M${Number(value).toFixed(2)}`;

export const formatDate = (dateString) => {
    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

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

    const date = new Date(dateString);

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