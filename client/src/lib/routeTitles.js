/**
 * Route -> document title.
 *
 * Every page in the app used to ship the same static <title>, so a user with
 * three QuickFix tabs open, a bookmark, or a shared history entry had no way
 * to tell them apart. Titles are resolved from the pathname here rather than
 * inside each page, which keeps the mapping in one reviewable place and stops
 * it drifting as routes move between layouts.
 *
 * Order matters: the first match wins, so literal paths must be listed before
 * the parameterised routes they would otherwise be captured by
 * (`/customer/requests/new` before `/customer/requests/:id`).
 */

const BRAND = "QuickFix";

/** Home keeps the full marketing title, which is also the index.html default. */
const HOME_TITLE = "Trusted service providers, close to home";

const ROUTES = [
    // Public
    [/^\/$/, HOME_TITLE],
    [/^\/login$/, "Log in"],
    [/^\/register$/, "Create an account"],
    [/^\/verify-email$/, "Verify your email"],
    [/^\/forgot-password$/, "Forgot password"],
    [/^\/reset-password$/, "Reset password"],
    [/^\/terms$/, "Terms & Conditions"],
    [/^\/privacy$/, "Privacy Policy"],
    [/^\/cookies$/, "Cookie Policy"],

    // Customer
    [/^\/customer\/dashboard$/, "Dashboard"],
    [/^\/customer\/requests$/, "My requests"],
    [/^\/customer\/requests\/new$/, "New service request"],
    [/^\/customer\/requests\/[^/]+$/, "Request details"],
    [/^\/customer\/services$/, "Services"],
    [/^\/customer\/services\/[^/]+$/, "Service category"],
    [/^\/customer\/products$/, "Products"],
    [/^\/customer\/providers$/, "Providers"],
    [/^\/customer\/providers\/[^/]+$/, "Provider profile"],
    [/^\/customer\/jobs$/, "Jobs"],
    [/^\/customer\/jobs\/[^/]+$/, "Job details"],
    [/^\/customer\/review\/[^/]+$/, "Leave a review"],
    [/^\/customer\/messages$/, "Messages"],
    [/^\/customer\/messages\/[^/]+$/, "Conversation"],

    // Provider
    [/^\/provider\/dashboard$/, "Provider dashboard"],
    [/^\/provider\/profile$/, "My profile"],
    [/^\/provider\/services$/, "My services"],
    [/^\/provider\/requests$/, "Available requests"],
    [/^\/provider\/requests\/[^/]+$/, "Request details"],
    [/^\/provider\/offers$/, "My offers"],
    [/^\/provider\/verification$/, "Verification"],
    [/^\/provider\/jobs$/, "Jobs"],

    // Business
    [/^\/business\/dashboard$/, "Business dashboard"],
    [/^\/business\/profile$/, "Business profile"],
    [/^\/business\/products$/, "My products"],
    [/^\/business\/advertisements$/, "Advertisements"],
    [/^\/business\/promotions$/, "Promotions"],
    [/^\/business\/analytics$/, "Analytics"],

    // Admin
    [/^\/admin\/dashboard$/, "Admin dashboard"],
    [/^\/admin\/users$/, "Users"],
    [/^\/admin\/providers$/, "Providers"],
    [/^\/admin\/providers\/[^/]+$/, "Provider profile"],
    [/^\/admin\/complaints$/, "Complaints"],
    [/^\/admin\/verification$/, "Verification"],
    [/^\/admin\/businesses$/, "Businesses"]
];

// Roles that share the same sub-pages (messages, notifications, ...).
const SHARED = [
    [/^\/(customer|provider|business|admin)\/messages(\/[^/]+)?$/, "Messages"],
    [
        /^\/(customer|provider|business|admin)\/notifications$/,
        "Notifications"
    ],
    [
        /^\/(customer|provider|business|admin)\/complaints$/,
        "Complaints"
    ],
    [/^\/(customer|provider|business|admin)\/settings$/, "Settings"]
];

/** Placeholder routes that render the "coming soon" panel. */
const PLACEHOLDER = [
    [/^\/(customer|provider|admin)\/.+$/, "Coming soon"]
];

/**
 * @param {string} pathname
 * @returns {string} a human title, without the brand suffix
 */
export function titleForPath(pathname) {
    const path = (pathname || "/").replace(/\/+$/, "") || "/";

    for (const [pattern, title] of [...ROUTES, ...SHARED, ...PLACEHOLDER]) {
        if (pattern.test(path)) {
            return title;
        }
    }

    return "Page not found";
}

/**
 * @param {string} pathname
 * @returns {string} the full document title
 */
export function documentTitleFor(pathname) {
    const title = titleForPath(pathname);

    return title === HOME_TITLE ? `${BRAND} — ${title}` : `${title} · ${BRAND}`;
}

export { BRAND, HOME_TITLE };
