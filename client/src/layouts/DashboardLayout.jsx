import { useEffect, useState, useMemo, useCallback } from "react";
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
import ScrollProgress from "../components/motion/ScrollProgress";
import ScrollToTop from "../components/motion/ScrollToTop";
import useScrollLock from "../hooks/useScrollLock";
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
        "/customer/requests",
        "/customer/requests/new",
        "/customer/jobs",
        "/customer/services"
    ],
    PROVIDER: [
        "/provider/dashboard",
        "/provider/requests",
        "/provider/jobs",
        "/provider/offers"
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
    const [condensed, setCondensed] = useState(false);

    useScrollLock(drawerOpen);

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
        setCondensed(false);
    }, [location.pathname]);

    // Elevates the app bar once content slides underneath it, so the bar reads
    // as a distinct layer rather than bleeding into the page.
    useEffect(() => {
        const onScroll = () => setCondensed(window.scrollY > 6);

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (!drawerOpen) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setDrawerOpen(false);
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [drawerOpen]);

    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login";
    };

    // The sidebars render a close button whenever `onClose` is supplied, so the
    // desktop instance must not receive it or a stray "X" shows on wide screens.
    const desktopSidebar = useMemo(
        () => ({ navItems, onNavigate: closeDrawer }),
        [navItems, closeDrawer]
    );

    const drawerSidebar = useMemo(
        () => ({ navItems, onNavigate: closeDrawer, onClose: closeDrawer }),
        [navItems, closeDrawer]
    );

    const providerSidebar = (props) => (
        <ProviderSidebar profile={profile} {...props} />
    );

    const notificationButton = notificationsPath ? (
        <Link
            to={notificationsPath}
            className="qf-tap-sm relative flex items-center rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600"
            title="Notifications"
            aria-label={
                unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
            }
        >
            <Icon name="bell" className="h-5 w-5" />
            {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                    {unread > 9 ? "9+" : unread}
                </span>
            )}
        </Link>
    ) : null;

    return (
        <div className="qf-page-glow flex min-h-dvh">
            <ScrollToTop />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">
                {role === "PROVIDER" ? (
                    providerSidebar(desktopSidebar)
                ) : (
                    <Sidebar {...desktopSidebar} />
                )}
            </aside>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="qf-fade-in-fast qf-overlay-block absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={closeDrawer}
                        aria-hidden="true"
                    />
                    <div
                        className="qf-drawer-in absolute inset-y-0 left-0 h-[100dvh] max-h-[100dvh] w-64 max-w-[85vw] overflow-hidden shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation"
                    >
                        {role === "PROVIDER" ? (
                            providerSidebar(drawerSidebar)
                        ) : (
                            <Sidebar {...drawerSidebar} />
                        )}
                    </div>
                </div>
            )}

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col md:pl-64">
                {/* App bar */}
                <header
                    className={[
                        "sticky top-0 z-20 border-b bg-white/85 backdrop-blur-xl",
                        "transition-[box-shadow,border-color] duration-300",
                        condensed
                            ? "border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.07)]"
                            : "border-transparent"
                    ].join(" ")}
                >
                    <div
                        className="flex min-h-[var(--qf-appbar-h)] items-center gap-1.5 px-2.5 pt-safe sm:px-6"
                    >
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="qf-tap-sm -ml-1 shrink-0 rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
                            aria-label="Open menu"
                        >
                            <Icon name="menu" className="h-[22px] w-[22px]" />
                        </button>

                        {/* Mobile: current screen, so the user is never lost */}
                        <h1 className="qf-title-in min-w-0 flex-1 truncate text-[17px] font-bold tracking-tight text-slate-900 md:hidden">
                            {currentLabel || ROLE_LABEL[role]}
                        </h1>

                        {/* Desktop breadcrumb */}
                        <div className="hidden min-w-0 items-center text-sm text-slate-500 md:flex">
                            <Link
                                to={dashboardPath}
                                className="inline-flex shrink-0 items-center gap-1.5 font-medium text-slate-500 transition hover:text-indigo-600"
                            >
                                <Icon name="home" className="h-4 w-4" />
                                {ROLE_LABEL[role]} home
                            </Link>
                            <Icon
                                name="chevronRight"
                                className="mx-2 h-4 w-4 shrink-0 text-slate-300"
                            />
                            <span className="truncate font-semibold text-slate-800">
                                {currentLabel}
                            </span>
                        </div>

                        <div className="ml-auto flex shrink-0 items-center gap-0.5">
                            {notificationButton}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="qf-tap-sm hidden items-center rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 md:inline-flex"
                                title="Log out"
                                aria-label="Log out"
                            >
                                <Icon name="logout" className="h-5 w-5" />
                            </button>

                            <Link
                                to={dashboardPath}
                                aria-label="Go to dashboard"
                                className="qf-tap-smooth flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50 md:hidden"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                                    {(user?.first_name || "?")[0]}
                                </span>
                                <span className="max-w-[7rem] truncate text-xs font-semibold text-slate-700">
                                    {user?.first_name}
                                </span>
                            </Link>
                        </div>
                    </div>

                    <ScrollProgress />
                </header>

                {/* Content */}
                <main className="qf-tabbar-space flex-1 px-3.5 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
                    <div
                        key={location.pathname}
                        className="qf-fade-in mx-auto w-full max-w-6xl"
                    >
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
