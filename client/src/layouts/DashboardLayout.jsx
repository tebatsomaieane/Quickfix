import { useEffect, useState, useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyNotifications } from "../services/notificationService";
import { fetchMyProviderProfile } from "../services/catalogueService";
import {
    ROLE_DASHBOARD_PATH,
    ROLE_NOTIFICATIONS_PATH,
    ROLE_LABEL
} from "../constants/navigation";
import Icon from "../components/ui/Icon";
import CustomerSidebar from "../components/sidebars/CustomerSidebar";
import ProviderSidebar from "../components/sidebars/ProviderSidebar";
import GenericSidebar from "../components/sidebars/GenericSidebar";
import MobileTabBar from "../components/sidebars/MobileTabBar";
import { useToast } from "../components/ui/ToastProvider";
import { onEvent } from "../services/realtimeService";

const SIDEBARS = {
    CUSTOMER: CustomerSidebar,
    PROVIDER: ProviderSidebar,
    BUSINESS_OWNER: GenericSidebar,
    ADMIN: GenericSidebar
};

const ROLE_TAB_ORDER = {
    CUSTOMER: [
        "/customer/dashboard",
        "/customer/requests/new",
        "/customer/requests",
        "/customer/jobs",
        "/customer/messages"
    ],
    PROVIDER: [
        "/provider/dashboard",
        "/provider/requests",
        "/provider/jobs",
        "/provider/offers",
        "/provider/messages"
    ],
    BUSINESS_OWNER: [
        "/business/dashboard",
        "/business/products",
        "/business/promotions",
        "/business/analytics"
    ],
    ADMIN: [
        "/admin/dashboard",
        "/admin/users",
        "/admin/providers",
        "/admin/complaints"
    ]
};

function DashboardLayout({ navItems }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const role = user?.role;
    const { showToast } = useToast();

    const Sidebar = SIDEBARS[role] || GenericSidebar;

    const dashboardPath = ROLE_DASHBOARD_PATH[role];
    const notificationsPath = ROLE_NOTIFICATIONS_PATH[role];

    const [unread, setUnread] = useState(0);
    const [profile, setProfile] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const matched = navItems.find(
        (item) =>
            (location.pathname === item.to ||
                location.pathname.startsWith(`${item.to}/`)) &&
            item.to !== "/"
    );

    const currentLabel =
        matched?.label ||
        (location.pathname === dashboardPath ? "Dashboard" : "");

    useEffect(() => {
        let active = true;

        async function refresh() {
            if (!notificationsPath) {
                return;
            }

            try {
                const data = await fetchMyNotifications();

                if (active) {
                    setUnread(
                        data.data.notifications.filter(
                            (notification) => !notification.is_read
                        ).length
                    );
                }
            } catch {
                // ignore - unread badge is non-critical
            }
        }

        refresh();

        const timer = setInterval(refresh, 30000);

        const unsubscribe = onEvent("notification", (payload) => {
            refresh();

            if (payload?.title) {
                showToast(payload.title, "info");
            }
        });

        return () => {
            active = false;
            clearInterval(timer);
            unsubscribe();
        };
    }, [notificationsPath, showToast]);

    useEffect(() => {
        if (role !== "PROVIDER") {
            return;
        }

        let active = true;

        fetchMyProviderProfile()
            .then((data) => {
                if (active) {
                    setProfile(data.data || null);
                }
            })
            .catch(() => {
                if (active) {
                    setProfile(null);
                }
            });

        return () => {
            active = false;
        };
    }, [role]);

    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    const sidebarProps = useMemo(
        () => ({ navItems, onNavigate: () => setDrawerOpen(false) }),
        [navItems]
    );

    const notificationButton = notificationsPath ? (
        <Link
            to={notificationsPath}
            className="relative flex items-center rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
            title="Notifications"
        >
            <Icon name="bell" className="h-5 w-5" />
            {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                </span>
            )}
        </Link>
    ) : null;

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">
                {role === "PROVIDER" ? (
                    <ProviderSidebar
                        navItems={navItems}
                        profile={profile}
                        onNavigate={() => setDrawerOpen(false)}
                    />
                ) : (
                    <Sidebar {...sidebarProps} />
                )}
            </aside>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setDrawerOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-y-0 left-0 shadow-2xl">
                        {role === "PROVIDER" ? (
                            <ProviderSidebar
                                navItems={navItems}
                                profile={profile}
                                onNavigate={() => setDrawerOpen(false)}
                            />
                        ) : (
                            <Sidebar {...sidebarProps} />
                        )}
                    </div>
                </div>
            )}

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col md:pl-64">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                            aria-label="Open menu"
                        >
                            <Icon name="menu" className="h-5 w-5" />
                        </button>

                        <div className="hidden items-center text-sm text-slate-500 md:flex">
                            <Link
                                to={dashboardPath}
                                className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-indigo-600"
                            >
                                <Icon name="home" className="h-4 w-4" />
                                {ROLE_LABEL[role]} home
                            </Link>
                            <Icon
                                name="chevronRight"
                                className="mx-2 h-4 w-4 text-slate-300"
                            />
                            <span className="font-semibold text-slate-800">
                                {currentLabel}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {notificationButton}
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 md:inline-flex"
                            title="Log out"
                        >
                            <Icon name="logout" className="h-5 w-5" />
                        </button>
                        <Link
                            to={dashboardPath}
                            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition hover:border-indigo-300 hover:bg-indigo-50 md:hidden"
                        >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                                {(user?.first_name || "?")[0]}
                            </span>
                            <span className="text-xs font-medium text-slate-700">
                                {user?.first_name}
                            </span>
                        </Link>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 pb-24 sm:p-6 lg:p-8 md:pb-6">
                    <div className="mx-auto max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile bottom navigation */}
            <MobileTabBar
                navItems={navItems}
                unread={unread}
                notificationsPath={notificationsPath}
                order={ROLE_TAB_ORDER[role]}
            />
        </div>
    );
}

export default DashboardLayout;