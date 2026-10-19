import { Link, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";

const isItemActive = (item, pathname) => {
    if (item.to === "/") {
        return pathname === "/";
    }

    return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

const badgeTone = (tone) =>
    tone === "indigo"
        ? "bg-gradient-to-br from-indigo-500 to-violet-600"
        : "bg-gradient-to-br from-rose-500 to-pink-600";

function SidebarNav({
    groups,
    variant = "light",
    onNavigate,
    badges = {},
    className = ""
}) {
    const { pathname } = useLocation();

    const styles =
        variant === "dark"
            ? {
                  sectionLabel: "text-slate-500",
                  itemIdle: "text-slate-300 hover:bg-white/5 hover:text-white",
                  itemActive: "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-300",
                  itemActiveIcon: "bg-emerald-500/20 text-emerald-300",
                  itemIdleIcon: "text-slate-400"
              }
            : {
                  sectionLabel: "text-slate-400",
                  itemIdle: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  itemActive: "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100",
                  itemActiveIcon: "bg-white text-indigo-600 shadow-sm",
                  itemIdleIcon: "text-slate-400"
              };

    return (
        <nav
            className={`qf-scroll-x flex-1 overflow-y-auto overscroll-contain px-3 py-4 ${className}`}
        >
            {groups.map((group) => (
                <div key={group.label} className="mb-5">
                    <p
                        className={[
                            "mb-1.5 px-3 text-[11px] font-bold uppercase tracking-widest",
                            styles.sectionLabel
                        ].join(" ")}
                    >
                        {group.label}
                    </p>
                    <ul className="space-y-1">
                        {group.items.map((item) => {
                            const active = isItemActive(item, pathname);

                            return (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        onClick={onNavigate}
                                        aria-current={
                                            active ? "page" : undefined
                                        }
                                        className={[
                                            "qf-tap group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200",
                                            active
                                                ? styles.itemActive
                                                : styles.itemIdle
                                        ].join(" ")}
                                    >
                                        {active && (
                                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                                        )}
                                        <span
                                            className={[
                                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                                                active
                                                    ? styles.itemActiveIcon
                                                    : styles.itemIdleIcon
                                            ].join(" ")}
                                        >
                                            <Icon
                                                name={item.icon}
                                                className="h-4 w-4"
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1 truncate">
                                            {item.label}
                                        </span>

                                        {badges[item.to] &&
                                            badges[item.to].count > 0 && (
                                                <span
                                                    className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white/60 ${badgeTone(
                                                        badges[item.to].tone
                                                    )}`}
                                                >
                                                    {badges[item.to].count > 99
                                                        ? "99+"
                                                        : badges[item.to].count}
                                                </span>
                                            )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

export default SidebarNav;