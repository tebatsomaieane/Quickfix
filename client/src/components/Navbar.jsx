import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./ui/Logo";

const ROLE_PATHS = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

function Navbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const loggedIn = !!user;

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        setMobileOpen(false);
        navigate("/");
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link
                    to="/"
                    className="flex items-center"
                    onClick={() => setMobileOpen(false)}
                >
                    <Logo brand="Quick" accent="Fix" />
                </Link>

                {/* Desktop links */}
                <div className="hidden items-center gap-1 md:flex">
                    <Link
                        to="/"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        Home
                    </Link>
                    <a
                        href="#how-it-works"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        How it works
                    </a>
                    <a
                        href="#for-businesses"
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        For businesses
                    </a>
                </div>

                {/* Desktop auth area */}
                <div className="hidden items-center gap-3 md:flex">
                    {loggedIn ? (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setMenuOpen(!menuOpen)
                                }
                                className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">
                                {(user?.first_name || "?")[0]}
                            </span>
                                <span>{user?.first_name}</span>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                                    <Link
                                        to={ROLE_PATHS[user?.role]}
                                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle navigation"
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
                <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
                    <div className="flex flex-col gap-1 pt-2">
                        <Link
                            to="/"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            onClick={() => setMobileOpen(false)}
                        >
                            Home
                        </Link>
                        <a
                            href="#how-it-works"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            onClick={() => setMobileOpen(false)}
                        >
                            How it works
                        </a>
                        <a
                            href="#for-businesses"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            onClick={() => setMobileOpen(false)}
                        >
                            For businesses
                        </a>

                        <div className="mt-2 border-t border-slate-100 pt-3">
                            {loggedIn ? (
                                <>
                                    <Link
                                        to={ROLE_PATHS[user?.role]}
                                        className="block rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        Log out
                                    </button>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <Link
                                        to="/login"
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-medium text-white"
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
        </header>
    );
}

export default Navbar;