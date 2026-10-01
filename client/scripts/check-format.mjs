/**
 * Checks the display formatters, which are pure functions used on nearly every
 * card in the app and therefore easy to break silently.
 *
 * The date cases are timezone-sensitive, so the process is pinned to a
 * timezone west of UTC — the arrangement that exposes the classic off-by-one
 * day bug when a `YYYY-MM-DD` string is parsed as UTC midnight.
 */
import { formatCurrency, formatDate, formatDateTime } from "../src/lib/format.js";

const failures = [];
const check = (name, condition, detail = "") => {
    if (condition) {
        console.log(`  PASS  ${name}`);
    } else {
        console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
        failures.push(name);
    }
};

console.log("Currency formatting");

check("whole amount keeps two decimals", formatCurrency(500) === "M500.00", formatCurrency(500));
check("amounts are grouped", formatCurrency(12345) === "M12,345.00", formatCurrency(12345));
check(
    "grouping works past a million",
    formatCurrency(1234567.891) === "M1,234,567.89",
    formatCurrency(1234567.891)
);
check("decimals are preserved", formatCurrency(99.5) === "M99.50", formatCurrency(99.5));
check("string input is accepted", formatCurrency("250") === "M250.00", formatCurrency("250"));
check("zero is a real amount", formatCurrency(0) === "M0.00", formatCurrency(0));
check("negatives keep their sign", formatCurrency(-50) === "-M50.00", formatCurrency(-50));
check("null renders nothing", formatCurrency(null) === "", JSON.stringify(formatCurrency(null)));
check("undefined renders nothing", formatCurrency(undefined) === "");
check("empty string renders nothing", formatCurrency("") === "");
check("junk does not render 'MNaN'", !formatCurrency("abc").includes("NaN"), formatCurrency("abc"));
check("NaN input renders nothing", formatCurrency(NaN) === "", JSON.stringify(formatCurrency(NaN)));
check("Infinity does not render 'Infinity'", !formatCurrency(Infinity).includes("Infinity"));

console.log("Date formatting");

// Pinned west of UTC so a UTC-midnight parse would visibly shift the day.
process.env.TZ = "America/Los_Angeles";
const expected = new Date(2026, 8, 27).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
});

check(
    "date-only string keeps its own day",
    formatDate("2026-09-27") === expected,
    `${formatDate("2026-09-27")} (expected ${expected})`
);
check(
    "a 31st is not pulled back a month",
    formatDate("2026-01-31") === new Date(2026, 0, 31).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }),
    formatDate("2026-01-31")
);
check(
    "full ISO timestamps still format",
    formatDate("2026-09-27T14:30:00") === expected,
    formatDate("2026-09-27T14:30:00")
);
check("empty date renders nothing", formatDate("") === "");
check("missing date renders nothing", formatDate(null) === "");
check("unparseable date is passed through", formatDate("not-a-date") === "not-a-date", formatDate("not-a-date"));
check(
    "date + time is not empty",
    formatDateTime("2026-09-27T14:30:00").length > 0
);
check("empty date-time renders nothing", formatDateTime("") === "");

console.log(
    failures.length === 0
        ? "\nAll format checks passed."
        : `\n${failures.length} check(s) failed.`
);

process.exit(failures.length === 0 ? 0 : 1);
