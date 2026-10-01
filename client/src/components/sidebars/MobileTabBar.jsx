import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "../ui/Icon";
import Sheet from "../ui/Sheet";
import { groupNavItems } from "../../constants/navigation";

const MAX_TABS = 5;

const isItemActive = (item, pathname) => {
    if (item.to === "/") {
        return pathname === "/";
    }

    return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

function MobileTabBar({
    navItems,
    unread = 0,
    notificationsPath,
    order = []
}) {
    const { pathname } = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);
    const [trackWidth, setTrackWidth] = useState(0);
    const trackRef = useRef(null);

    const { tabs, overflow, overflowActive } = useMemo(() => {
        const resolved = order
            .map((to) => navItems.find((item) => item.to === to))
            .filter(Boolean);

        // Every role has destinations that do not fit in the tab rail
        // (settings, verification, profile, support…). Those move into the
        // "More" sheet so nothing is unreachable on a phone.
        const primary = resolved.slice(0, MAX_TABS - 1);
        const primaryPaths = new Set(primary.map((item) => item.to));

        const rest = navItems.filter((item) => !primaryPaths.has(item.to));

        if (notificationsPath && !primaryPaths.has(notificationsPath)) {
            const alreadyPresent = rest.some(
                (item) => item.to === notificationsPath
            );

            if (!alreadyPresent) {
                rest.unshift({
                    to: notificationsPath,
                    label: "Notifications",
                    icon: "bell"
                });
            }
        }

        const activeInOverflow = rest.some((item) =>
            isItemActive(item, pathname)
        );

        return {
            tabs: primary,
            overflow: rest,
            overflowActive: activeInOverflow
        };
    }, [navItems, order, notificationsPath, pathname]);

    const tabsWithMore = useMemo(
        () =>
            overflow.length > 0
                ? [
                      ...tabs,
                      {
                          to: "__more__",
                          label: "More",
                          icon: "more"
                      }
                  ]
                : tabs,
        [tabs, overflow.length]
    );

    const matchedIndex = tabsWithMore.findIndex((item) =>
        item.to === "__more__"
            ? overflowActive
            : isItemActive(item, pathname)
    );

    const activeIndex = matchedIndex === -1 ? -1 : matchedIndex;

    useEffect(() => {
        const el = trackRef.current;

        if (!el || typeof ResizeObserver === "undefined") {
            return undefined;
        }

        const observer = new ResizeObserver(([entry]) => {
            setTrackWidth(entry.contentRect.width);
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        setMoreOpen(false);
    }, [pathname]);

    const onMoreTap = useCallback(() => {
        setMoreOpen((open) => !open);
    }, []);

    const slotWidth =
        trackWidth > 0 && tabsWithMore.length > 0
            ? 100 / tabsWithMore.length
            : 0;

    return (
        <>
            <nav
                className="bottom-safe qf-fade-in fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 md:hidden"
                aria-label="Primary"
            >
                <div className="relative mx-auto w-full max-w-md">
                    {/* Sliding active pill, clipped to the rail's inner gutter */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-1.5 left-1.5 right-1.5 overflow-hidden rounded-2xl"
                    >
                        <span
                            className="absolute inset-y-0 rounded-2xl bg-indigo-50 shadow-[0_2px_10px_rgba(99,102,241,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            style={{
                                width: `${slotWidth}%`,
                                opacity: activeIndex === -1 ? 0 : 1,
                                transform: `translate3d(${
                                    activeIndex === -1 ? 0 : activeIndex * 100
                                }%, 0, 0)`
                            }}
                        />
                    </span>

                    <div
                        ref={trackRef}
                        className="relative flex items-stretch rounded-3xl border border-slate-200/80 bg-white/92 px-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                    >
                        {tabsWithMore.map((item) => {
                            const isMore = item.to === "__more__";
                            const active = isMore
                                ? overflowActive
                                : isItemActive(item, pathname);
                            const isNotify = item.to === notificationsPath;

                            const className = [
                                "qf-tap-sm relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-2",
                                "text-[10px] font-semibold leading-none",
                                active
                                    ? "text-indigo-700"
                                    : "text-slate-500"
                            ].join(" ");

                            const body = (
                                <>
                                    <span className="relative flex h-7 w-11 items-center justify-center">
                                        <Icon
                                            name={item.icon}
                                            className="h-[22px] w-[22px]"
                                        />
                                        {isNotify && unread > 0 && (
                                            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] animate-badge-pop items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                                                {unread > 9
                                                    ? "9+"
                                                    : unread}
                                            </span>
                                        )}
                                    </span>
                                    <span className="max-w-full truncate">
                                        {item.label}
                                    </span>
                                </>
                            );

                            return isMore ? (
                                <button
                                    key={item.to}
                                    type="button"
                                    onClick={onMoreTap}
                                    className={className}
                                    aria-expanded={moreOpen}
                                    aria-haspopup="dialog"
                                >
                                    {body}
                                </button>
                            ) : (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={className}
                                    aria-current={
                                        active ? "page" : undefined
                                    }
                                >
                                    {body}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            <Sheet
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                title="More"
                description="Everything else in your workspace"
            >
                <div className="pb-2">
                    {groupNavItems(overflow).map((group) => (
                        <div key={group.label} className="mb-4 last:mb-0">
                            <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                {group.label}
                            </p>

                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const active = isItemActive(
                                        item,
                                        pathname
                                    );
                                    const isNotify =
                                        item.to === notificationsPath;

                                    return (
                                        <li key={item.to}>
                                            <Link
                                                to={item.to}
                                                onClick={() =>
                                                    setMoreOpen(false)
                                                }
                                                className={[
                                                    "qf-tap flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold",
                                                    active
                                                        ? "bg-indigo-50 text-indigo-700"
                                                        : "bg-slate-50 text-slate-700"
                                                ].join(" ")}
                                            >
                                                <span
                                                    className={[
                                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                                        active
                                                            ? "bg-white text-indigo-600 shadow-sm"
                                                            : "bg-white text-slate-500"
                                                    ].join(" ")}
                                                >
                                                    <Icon
                                                        name={item.icon}
                                                        className="h-[18px] w-[18px]"
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1 truncate">
                                                    {item.label}
                                                </span>
                                                {isNotify &&
                                                    unread > 0 && (
                                                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 px-1.5 text-[10px] font-bold text-white">
                                                            {unread > 99
                                                                ? "99+"
                                                                : unread}
                                                        </span>
                                                    )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </Sheet>
        </>
    );
}

export default MobileTabBar;
