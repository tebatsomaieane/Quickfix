import { useEffect, useState } from "react";
import { fetchUsers, updateUser } from "../../services/adminService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Input from "../../components/ui/Input";
import { formatDate } from "../../lib/format";

const ROLE_COLORS = {
    CUSTOMER: "indigo",
    PROVIDER: "green",
    BUSINESS_OWNER: "amber",
    ADMIN: "slate"
};

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [savingId, setSavingId] = useState(null);

    const load = (params = {}) => {
        setLoading(true);
        fetchUsers(params)
            .then((data) => setUsers(data.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        load({ q: search || undefined, role: role || undefined });
    };

    const handleToggleActive = async (user) => {
        setSavingId(user.id);
        try {
            await updateUser(user.id, { is_active: !user.is_active });
            load({ q: q || undefined, role: role || undefined });
        } catch {} finally {
            setSavingId(null);
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Users</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        View and manage all registered accounts.
                    </p>
                </div>
            </div>

            <Card className="mb-6 p-5">
                <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-52 flex-1">
                        <Input
                            label="Search"
                            id="search"
                            placeholder="Name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-44">
                        <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
                            Role
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="">All roles</option>
                            <option value="CUSTOMER">Customer</option>
                            <option value="PROVIDER">Provider</option>
                            <option value="BUSINESS_OWNER">Business owner</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <Button type="submit" variant="secondary">Apply</Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setSearch("");
                            setRole("");
                            setQ("");
                            load();
                        }}
                    >
                        Reset
                    </Button>
                </form>
            </Card>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : users.length === 0 ? (
                <EmptyState title="No users found" description="Try adjusting your search or filters." />
            ) : (
                <>
                    <Card className="hidden overflow-hidden md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-slate-50 text-xs font-semibold tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Verified</th>
                                        <th className="px-4 py-3">Joined</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">
                                                {user.first_name} {user.last_name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <Badge color={ROLE_COLORS[user.role] || "slate"}>
                                                    {user.role.toLowerCase().replace("_", " ")}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge color={user.is_active ? "green" : "red"}>
                                                    {user.is_active ? "active" : "disabled"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.email_verified ? (
                                                    <Badge color="green">verified</Badge>
                                                ) : (
                                                    <Badge color="amber">pending</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400">{formatDate(user.created_at)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant={user.is_active ? "danger" : "secondary"}
                                                    loading={savingId === user.id}
                                                    onClick={() => handleToggleActive(user)}
                                                >
                                                    {user.is_active ? "Disable" : "Enable"}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <div className="space-y-3 md:hidden">
                        {users.map((user) => (
                            <Card key={user.id} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-900">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <p className="mt-0.5 truncate text-sm text-slate-500">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Badge color={user.is_active ? "green" : "red"}>
                                        {user.is_active ? "active" : "disabled"}
                                    </Badge>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                    <div>
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Role
                                        </p>
                                        <div className="mt-1">
                                            <Badge color={ROLE_COLORS[user.role] || "slate"}>
                                                {user.role.toLowerCase().replace("_", " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Email verified
                                        </p>
                                        <div className="mt-1">
                                            {user.email_verified ? (
                                                <Badge color="green">verified</Badge>
                                            ) : (
                                                <Badge color="amber">pending</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                            Joined
                                        </p>
                                        <p className="mt-1 text-slate-600">
                                            {formatDate(user.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                                    <Button
                                        variant={user.is_active ? "danger" : "secondary"}
                                        loading={savingId === user.id}
                                        onClick={() => handleToggleActive(user)}
                                    >
                                        {user.is_active ? "Disable" : "Enable"}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminUsers;