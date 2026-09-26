import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { groupNavItems } from "../../constants/navigation";
import SidebarNav from "./SidebarNav";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

function CustomerSidebar({ navItems, onNavigate }) {
    const { user, logout } = useAuth();
    const groups = groupNavItems(navItems);

    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-slate-200/80 bg-gradient-to-b from-white to-indigo-50/40 px-5">
                <Logo brand="Quick" accent="Fix" />
            </div>

            {/* CTA */}
            <div className="px-4 pt-4">
                <Link
                    to="/customer/requests/new"
                    onClick={onNavigate}
                    className="group flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] bg-left px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-300 hover:bg-right hover:shadow-lg hover:shadow-indigo-300/60"
                >
                    <span className="flex items-center gap-2">
                        <Icon name="plus" className="h-4 w-4" />
                        Post a request
                    </span>
                    <Icon
                        name="arrowRight"
                        className="h-4 w-4 transition group-hover:translate-x-0.5"
                    />
                </Link>
            </div>

            <SidebarNav
                groups={groups}
                variant="light"
                onNavigate={onNavigate}
                className="mt-3"
            />

            {/* User footer */}
            <div className="border-t border-slate-200 p-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-200">
                        {(user?.first_name || "?")[0]}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            Customer
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Log out"
                        onClick={logout}
                        className="ml-auto rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                        <Icon name="logout" className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CustomerSidebar;