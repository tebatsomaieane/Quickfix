import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./ui/Logo";
import ScrollProgress from "./motion/ScrollProgress";

const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

const NAV_LINKS = [
    { to: "/", label: "Home" },
    { to: "/#how-it-works", label: "How it works", hash: "how-it-works" },
    { to: "/#for-businesses", label: "For businesses", hash: "for-businesses" }
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
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const loggedIn = !!user;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        setMobileOpen(false);
        navigate("/");
    };

    const goTo = (item) => {
        setMobileOpen(false);

        if (item.hash) {
            if (window.location.pathname !== "/") {
                navigate("/");
                setTimeout(() => {
                    document
                        .getElementById(item.hash)
                        ?.scrollIntoView({ behavior: "smooth" });
                }, 80);
            } else {
                document
                    .getElementById(item.hash)
                    ?.scrollIntoView({ behavior: "smooth" });
            }

            return;
        }

        navigate(item.to);
    };

    return (
        <header
            className={[
                "sticky top-0 z-40 transition-all duration-300",
                scrolled
                    ? "bg-white/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)] backdrop-blur-xl"
                    : "bg-white/60 backdrop-blur-md"
            ].join(" ")}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link
                        to="/"
                        className="flex items-center"
                        onClick={() => setMobileOpen(false)}
                    >
                        <Logo brand="Quick" accent="Fix" />
                    </Link>

                {/* Desktop links */}
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => goTo(item)}
                            className={linkClasses(false)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Desktop auth area */}
                <div className="hidden items-center gap-3 md:flex">
                    {loggedIn ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                                    {(user?.first_name || "?")[0]}
                                </span>
                                <span>{user?.first_name}</span>
                            </button>

                            {menuOpen && (
                                <div className="qf-fade-in absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white/95 py-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
                                    <Link
                                        to={ROLE_PATHS[user?.role]}
                                        className="block px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type="button"
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
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] bg-left px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-lg hover:shadow-indigo-500/30"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation"
                    aria-expanded={mobileOpen}
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        {mobileOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>
            </nav>

            {/* Mobile panel */}
            {mobileOpen && (
                <div className="border-t border-slate-100 bg-white/95 px-4 pb-6 backdrop-blur-xl md:hidden">
                    <div className="flex flex-col gap-1 pt-3">
                        {NAV_LINKS.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => goTo(item)}
                                className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                            >
                                {item.label}
                            </button>
                        ))}

                        <div className="mt-2 border-t border-slate-100 pt-3">
                            {loggedIn ? (
                                <>
                                    <Link
                                        to={ROLE_PATHS[user?.role]}
                                        className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-rose-50"
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goTo({ to: "/login" })}
                                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        Log in
                                    </button>
                                    <Link
                                        to="/register"
                                        className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-md shadow-indigo-500/25"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ScrollProgress />
        </header>
    );
}

export default Navbar;