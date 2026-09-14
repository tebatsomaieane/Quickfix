export const CUSTOMER_NAV = [
    { to: "/customer/dashboard", label: "Dashboard", icon: "grid", section: "Marketplace" },
    { to: "/customer/services", label: "Services", icon: "wrench", section: "Marketplace" },
    { to: "/customer/products", label: "Products & shops", icon: "inbox", section: "Marketplace" },
    { to: "/customer/providers", label: "Find providers", icon: "users", section: "Marketplace" },
    { to: "/customer/requests/new", label: "Post a request", icon: "sparkles", section: "My activity" },
    { to: "/customer/requests", label: "My requests", icon: "file", section: "My activity" },
    { to: "/customer/jobs", label: "My jobs", icon: "briefcase", section: "My activity" },
    { to: "/customer/messages", label: "Messages", icon: "chat", section: "Support" },
    { to: "/customer/complaints", label: "Support centre", icon: "megaphone", section: "Support" },
    { to: "/customer/settings", label: "Account settings", icon: "settings", section: "Support" }
];

export const PROVIDER_NAV = [
    { to: "/provider/dashboard", label: "Workbench", icon: "grid", section: "Workspace" },
    { to: "/provider/requests", label: "Available requests", icon: "inbox", section: "Workspace" },
    { to: "/provider/offers", label: "My offers", icon: "file", section: "Workspace" },
    { to: "/provider/jobs", label: "Jobs", icon: "briefcase", section: "Workspace" },
    { to: "/provider/services", label: "Services & pricing", icon: "wrench", section: "Business" },
    { to: "/provider/profile", label: "Business profile", icon: "user", section: "Business" },
    { to: "/provider/verification", label: "Verification", icon: "shield", section: "Business" },
    { to: "/provider/messages", label: "Messages", icon: "chat", section: "Support" },
    { to: "/provider/complaints", label: "Support centre", icon: "megaphone", section: "Support" },
    { to: "/provider/settings", label: "Settings", icon: "settings", section: "Support" }
];

export const BUSINESS_NAV = [
    { to: "/business/dashboard", label: "Overview", icon: "grid", section: "Store" },
    { to: "/business/profile", label: "Business profile", icon: "briefcase", section: "Store" },
    { to: "/business/products", label: "Products", icon: "inbox", section: "Store" },
    { to: "/business/promotions", label: "Promotions", icon: "bolt", section: "Growth" },
    { to: "/business/advertisements", label: "Advertisements", icon: "megaphone", section: "Growth" },
    { to: "/business/analytics", label: "Analytics", icon: "chart", section: "Growth" },
    { to: "/business/notifications", label: "Notifications", icon: "bell", section: "Support" },
    { to: "/business/settings", label: "Settings", icon: "settings", section: "Support" }
];

export const ADMIN_NAV = [
    { to: "/admin/dashboard", label: "Overview", icon: "grid", section: "Administration" },
    { to: "/admin/users", label: "Users", icon: "users", section: "Administration" },
    { to: "/admin/providers", label: "Providers", icon: "user", section: "Administration" },
    { to: "/admin/businesses", label: "Businesses", icon: "briefcase", section: "Administration" },
    { to: "/admin/complaints", label: "Complaints", icon: "megaphone", section: "Operations" },
    { to: "/admin/verification", label: "Verification", icon: "shield", section: "Operations" },
    { to: "/admin/settings", label: "Settings", icon: "settings", section: "Operations" }
];

export const ROLE_NAV = {
    CUSTOMER: CUSTOMER_NAV,
    PROVIDER: PROVIDER_NAV,
    BUSINESS_OWNER: BUSINESS_NAV,
    ADMIN: ADMIN_NAV
};

export const groupNavItems = (items) => {
    const sections = [];
    const labelToKey = new Map();

    items.forEach((item) => {
        const key = item.section || "General";

        if (!labelToKey.has(key)) {
            labelToKey.set(key, sections.length);
            sections.push({ label: key, items: [] });
        }

        sections[labelToKey.get(key)].items.push(item);
    });

    return sections;
};

export const ROLE_DASHBOARD_PATH = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

export const ROLE_NOTIFICATIONS_PATH = {
    CUSTOMER: "/customer/notifications",
    PROVIDER: "/provider/notifications",
    BUSINESS_OWNER: "/business/notifications"
};

export const ROLE_LABEL = {
    CUSTOMER: "Customer",
    PROVIDER: "Provider",
    BUSINESS_OWNER: "Business owner",
    ADMIN: "Admin"
};