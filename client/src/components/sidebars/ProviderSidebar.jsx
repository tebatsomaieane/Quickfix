import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { groupNavItems } from "../../constants/navigation";
import SidebarNav from "./SidebarNav";
import Icon from "../ui/Icon";
import Logo from "../ui/Logo";
import ProviderAvatar from "../ui/ProviderAvatar";
import VerificationBadge from "../ui/VerificationBadge";

function ProviderSidebar({ navItems, onNavigate, profile }) {
    const { user, logout } = useAuth();
    const groups = groupNavItems(navItems);
    const verified = profile?.verification_status === "APPROVED";

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-300">
            {/* Logo */}
            <div className="flex h-16 items-center border-b border-white/10 px-5">
                <Logo
                    tone="pro"
                    onDark
                    brand="QuickFix"
                    accent="Pro"
                    tagline="Provider workspace"
                />
            </div>

            {/* Provider card */}
            <div className="px-4 pt-4">
                <Link
                    to="/provider/profile"
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-emerald-400/30 hover:bg-white/10"
                >
                    <ProviderAvatar
                        name={`${profile?.first_name || user?.first_name} ${profile?.last_name || user?.last_name}`}
                        image={profile?.profile_image}
                        size="sm"
                        seed="provider-profile"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                            {profile?.first_name || user?.first_name}{" "}
                            {profile?.last_name || user?.last_name}
                        </p>
                        <VerificationBadge
                            verified={verified}
                            pending={profile?.verification_status === "PENDING"}
                            compact
                        />
                    </div>
                </Link>
            </div>

            <SidebarNav
                groups={groups}
                variant="dark"
                onNavigate={onNavigate}
                className="mt-3"
            />

            {/* Grow card */}
            <div className="p-4">
                <Link
                    to="/provider/verification"
                    onClick={onNavigate}
                    className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-4 text-white shadow-lg shadow-emerald-900/30"
                >
                    <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon name="shield" className="h-4 w-4" />
                        {verified ? "Keep shining" : "Get verified"}
                    </div>
                    <p className="mt-1 text-xs text-emerald-50/90">
                        {verified
                            ? "Verified providers earn more trust — and more jobs."
                            : "Verified providers win more jobs. Complete it today."}
                    </p>
                </Link>
            </div>

            {/* User footer */}
            <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow">
                        {(user?.first_name || "?")[0]}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            Service provider
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Log out"
                        onClick={logout}
                        className="ml-auto rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                        <Icon name="logout" className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProviderSidebar;