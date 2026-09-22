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
            className="bottom-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur md:hidden"
            aria-label="Primary"
        >
            <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
                {primaryItems.map((item) => {
                    const active = isItemActive(item, pathname);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={[
                                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition",
                                active
                                    ? "text-indigo-600"
                                    : "text-slate-500 hover:text-slate-800"
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "flex h-7 w-12 items-center justify-center rounded-full",
                                    active
                                        ? "bg-indigo-100"
                                        : ""
                                ].join(" ")}
                            >
                                <Icon name={item.icon} className="h-5 w-5" />
                                {item.to === notificationsPath && unread > 0 && (
                                    <span className="absolute right-1/2 top-1 ml-4 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
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