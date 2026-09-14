import { Link, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";

const isItemActive = (item, pathname) => {
    if (item.to === "/") {
        return pathname === "/";
    }

    return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

function SidebarNav({
    groups,
    variant = "light",
    onNavigate,
    className = ""
}) {
    const { pathname } = useLocation();

    const styles =
        variant === "dark"
            ? {
                  sectionLabel: "text-slate-500",
                  itemIdle: "text-slate-300 hover:bg-white/5 hover:text-white",
                  itemActive: "bg-emerald-500/10 text-emerald-300",
                  itemActiveBar: "bg-emerald-400"
              }
            : {
                  sectionLabel: "text-slate-400",
                  itemIdle: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  itemActive: "bg-indigo-50 text-indigo-700",
                  itemActiveBar: "bg-indigo-600"
              };

    return (
        <nav className={`flex-1 overflow-y-auto px-3 py-4 ${className}`}>
            {groups.map((group) => (
                <div key={group.label} className="mb-5">
                    <p
                        className={[
                            "mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider",
                            styles.sectionLabel
                        ].join(" ")}
                    >
                        {group.label}
                    </p>
                    <ul className="space-y-0.5">
                        {group.items.map((item) => {
                            const active = isItemActive(item, pathname);

                            return (
                                <li key={item.to}>
                                    <Link
                                        to={item.to}
                                        onClick={onNavigate}
                                        className={[
                                            "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                                            active
                                                ? styles.itemActive
                                                : styles.itemIdle
                                        ].join(" ")}
                                    >
                                        {active && (
                                            <span
                                                className={[
                                                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full",
                                                    styles.itemActiveBar
                                                ].join(" ")}
                                            />
                                        )}
                                        <Icon name={item.icon} className="h-5 w-5" />
                                        <span className="truncate">{item.label}</span>
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