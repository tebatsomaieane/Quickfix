import { useAuth } from "../../context/AuthContext";
import { groupNavItems } from "../../constants/navigation";
import SidebarNav from "./SidebarNav";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

function GenericSidebar({ navItems, brand = "QuickFix", onNavigate }) {
    const { user, logout } = useAuth();
    const groups = groupNavItems(navItems);
    const isAdmin = user?.role === "ADMIN";

    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-16 items-center border-b border-slate-200 px-5">
                {isAdmin ? (
                    <Logo
                        brand={brand}
                        accent="Admin"
                        tone="admin"
                        badge="Console"
                    />
                ) : (
                    <Logo brand={brand} accent="Fix" />
                )}
            </div>

            <SidebarNav
                groups={groups}
                variant="light"
                onNavigate={onNavigate}
                className="mt-3"
            />

            <div className="border-t border-slate-200 p-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white shadow">
                        {(user?.first_name || "?")[0]}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {user?.role.toLowerCase().replace("_", " ")}
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

export default GenericSidebar;