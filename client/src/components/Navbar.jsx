import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./ui/Logo";
import Icon from "./ui/Icon";
import MobileMenu from "./ui/MobileMenu";
import ScrollProgress from "./motion/ScrollProgress";
import useScrollLock from "../hooks/useScrollLock";

const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

const NAV_LINKS = [
    {
        to: "/",
        label: "Home",
        description: "Back to the top",
        icon: "home"
    },
    {
        to: "/#how-it-works",
        label: "How it works",
        description: "Request, compare, hire",
        icon: "sparkles",
        hash: "how-it-works"
    },
    {
        to: "/#for-businesses",
        label: "For businesses",
        description: "Advertise your products",
        icon: "building",
        hash: "for-businesses"
    }
];

const linkClasses = (active) =>
    [
        "rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors duration-200",
        active
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    ].join(" ");

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(64);
    const headerRef = useRef(null);
    const accountMenuRef = useRef(null);

    useScrollLock(mobileOpen);

    const loggedIn = !!user;
    const onHome = location.pathname === "/";

    useEffect(() => {
        const el = headerRef.current;

        if (!el) {
            return undefined;
        }

        const measure = () => setHeaderHeight(el.offsetHeight);

        measure();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure);
            return () => window.removeEventListener("resize", measure);
        }

        const observer = new ResizeObserver(measure);
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // While the menu is open the body is pinned, so `scrollY` reads 0 and
        // would flip the bar back to its unscrolled look. Skip the listener and
        // re-read once the lock is released.
        if (mobileOpen) {
            return undefined;
        }

        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, [mobileOpen]);

    useEffect(() => {
        setMobileOpen(false);
        setMenuOpen(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                // Send focus back to the trigger so keyboard users are not
                // dropped at the top of the document.
                accountMenuRef.current?.querySelector("button")?.focus();
            }
        };

        // Close on any pointer press outside the menu. `pointerdown` fires
        // before focus moves, so the menu is gone before the click lands and
        // the press cannot activate whatever sits underneath.
        const onPointerDown = (event) => {
            if (!accountMenuRef.current?.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [menuOpen]);

    const closeMobile = useCallback(() => setMobileOpen(false), []);

    const handleLogout = async () => {
        await logout();
        setMobileOpen(false);
        setMenuOpen(false);
        navigate("/");
    };

    const goTo = (item) => {
        closeMobile();

        if (item.hash) {
            const scrollToHash = () => {
                document
                    .getElementById(item.hash)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
            };

            if (!onHome) {
                navigate("/");
                setTimeout(scrollToHash, 90);
            } else {
                scrollToHash();
            }

            return;
        }

        navigate(item.to);
    };

    const authButton = (
        <div className="flex items-center gap-1.5">
            {loggedIn ? (
                <Link
                    to={ROLE_PATHS[user?.role]}
                    onClick={closeMobile}
                    className="qf-tap-smooth inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25"
                >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
                        {(user?.first_name || "?")[0]}
                    </span>
                    Dashboard
                </Link>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={() => goTo({ to: "/login" })}
                        className="qf-tap-smooth rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                        Log in
                    </button>
                    <Link
                        to="/register"
                        onClick={closeMobile}
                        className="qf-btn-shine rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25"
                    >
                        Sign up
                    </Link>
                </>
            )}
        </div>
    );

    return (
        <header
            ref={headerRef}
            className={[
                "sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300",
                scrolled
                    ? "bg-white/85 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl"
                    : "bg-white/70 backdrop-blur-md"
            ].join(" ")}
        >
            <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-4 pt-safe sm:px-6 lg:px-8">
                <Link to="/" className="shrink-0" onClick={closeMobile}>
                    <Logo brand="Quick" accent="Fix" />
                </Link>

                {/* Desktop links */}
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => goTo(item)}
                            className={linkClasses(onHome && !item.hash)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Desktop auth area */}
                <div className="hidden items-center gap-3 md:flex">
                    {loggedIn ? (
                        <div className="relative" ref={accountMenuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen(!menuOpen)}
                                aria-expanded={menuOpen}
                                aria-haspopup="menu"
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                                    {(user?.first_name || "?")[0]}
                                </span>
                                <span>{user?.first_name}</span>
                                <Icon
                                    name="chevronDown"
                                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                                        menuOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {menuOpen && (
                                <div
                                    role="menu"
                                    className="qf-fade-in absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white/95 py-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl"
                                >
                                    <Link
                                        to={ROLE_PATHS[user?.role]}
                                        role="menuitem"
                                        className="block px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-rose-50"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => goTo({ to: "/login" })}
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                Log in
                            </button>
                            <Link
                                to="/register"
                                className="qf-btn-shine inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] bg-left px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-300 hover:bg-right hover:shadow-lg hover:shadow-indigo-500/30"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile: primary actions stay in the bar, menu is secondary */}
                <div className="flex items-center gap-1 md:hidden">
                    {authButton}

                    <button
                        type="button"
                        className="qf-tap-sm flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                        aria-expanded={mobileOpen}
                    >
                        <Icon
                            name={mobileOpen ? "x" : "menu"}
                            className="h-6 w-6"
                        />
                    </button>
                </div>
            </nav>

            {/* Mobile overlay — portalled out of the header, because the
                header's `backdrop-blur` would otherwise become the containing
                block for a `fixed` panel and collapse it to nothing. */}
            <MobileMenu
                open={mobileOpen}
                onClose={closeMobile}
                top={headerHeight}
                links={NAV_LINKS.map((item) => ({
                    ...item,
                    onSelect: () => goTo(item)
                }))}
            >
                <div className="mt-3 border-t border-slate-100 pt-3">
                    {loggedIn ? (
                        <div className="flex flex-col gap-2">
                            <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Signed in as {user?.first_name}
                            </p>
                            <Link
                                to={ROLE_PATHS[user?.role]}
                                onClick={closeMobile}
                                className="qf-btn-shine flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
                            >
                                <Icon name="grid" className="h-4 w-4" />
                                Go to dashboard
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="qf-tap-smooth flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-600"
                            >
                                <Icon name="logout" className="h-4 w-4" />
                                Log out
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p className="px-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Get started
                            </p>
                            <Link
                                to="/register"
                                onClick={closeMobile}
                                className="qf-btn-shine flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
                            >
                                <Icon name="sparkles" className="h-4 w-4" />
                                Create a free account
                            </Link>
                            <button
                                type="button"
                                onClick={() => goTo({ to: "/login" })}
                                className="qf-tap-smooth flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700"
                            >
                                <Icon name="user" className="h-4 w-4" />
                                Log in
                            </button>
                        </div>
                    )}

                    <p className="px-1 pb-1 pt-4 text-center text-xs leading-relaxed text-slate-400">
                        QuickFix · Lesotho&apos;s local service marketplace
                    </p>
                </div>
            </MobileMenu>

            <ScrollProgress />
        </header>
    );
}

export default Navbar;
