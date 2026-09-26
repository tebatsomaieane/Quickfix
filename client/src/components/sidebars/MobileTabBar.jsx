import { Link, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";

const isItemActive = (item, pathname) => {
    if (item.to === "/") {
        return pathname === "/";
    }

    return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

function MobileTabBar({ navItems, unread = 0, notificationsPath, order = [] }) {
    const { pathname } = useLocation();

    const ordered =
        order.length > 0
            ? order
                  .map((to) => navItems.find((item) => item.to === to))
                  .filter(Boolean)
            : navItems.slice(0, 4);

    const primaryItems = [
        ...ordered,
        ...(notificationsPath
            ? [
                  {
                      to: notificationsPath,
                      label: "Alerts",
                      icon: "bell"
                  }
              ]
            : [])
    ].slice(0, 5);

    return (
        <nav
            className="qf-fade-in bottom-safe fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-1 md:hidden"
            aria-label="Primary"
        >
            <div className="mx-auto flex max-w-md items-stretch justify-around rounded-3xl border border-slate-200/80 bg-white/90 px-2 shadow-[0_8px_32px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                {primaryItems.map((item) => {
                    const active = isItemActive(item, pathname);
                    const isNotify = item.to === notificationsPath;

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={[
                                "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-all duration-200",
                                active
                                    ? "text-indigo-600"
                                    : "text-slate-500 hover:text-slate-800"
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200",
                                    active ? "bg-indigo-100/80" : "bg-transparent"
                                ].join(" ")}
                            >
                                <span
                                    className={[
                                        "pointer-events-none absolute inset-x-2 bottom-8 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-opacity duration-200",
                                        active
                                            ? "opacity-100"
                                            : "opacity-0"
                                    ].join(" ")}
                                />
                                <Icon name={item.icon} className="h-5 w-5" />
                                {isNotify && unread > 0 && (
                                    <span className="absolute right-1/2 top-1 ml-4 flex h-4 min-w-4 animate-badge-pop items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {unread > 9 ? "9+" : unread}
                                    </span>
                                )}
                            </span>
                            <span className="max-w-full truncate">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

export default MobileTabBar;