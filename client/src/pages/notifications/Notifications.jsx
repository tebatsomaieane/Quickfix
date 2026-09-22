import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    deleteNotification,
    fetchMyNotifications,
    markAllNotificationsRead,
    markNotificationRead
} from "../../services/notificationService";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Icon from "../../components/ui/Icon";
import { formatDateTime } from "../../lib/format";

const ROLE_DASHBOARD = {
    CUSTOMER: "/customer/dashboard",
    PROVIDER: "/provider/dashboard",
    BUSINESS_OWNER: "/business/dashboard",
    ADMIN: "/admin/dashboard"
};

function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    const load = () => {
        setLoading(true);

        fetchMyNotifications()
            .then((data) => setNotifications(data.data.notifications))
            .catch(() => setNotifications([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const handleMarkAll = async () => {
        setMarking(true);

        try {
            await markAllNotificationsRead();
            load();
        } catch {
            // ignore - notifications still load
        } finally {
            setMarking(false);
        }
    };

    const handleMarkOne = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((notification) =>
                    notification.id === id
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
        } catch {
            // ignore - user can retry from the list
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications((prev) =>
                prev.filter((notification) => notification.id !== id)
            );
        } catch {
            // ignore - user can retry from the list
        }
    };

    const unread = notifications.filter(
        (notification) => !notification.is_read
    ).length;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Notifications
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {unread > 0
                            ? `${unread} unread notification${unread === 1 ? "" : "s"}`
                            : "You are all caught up."}
                    </p>
                </div>

                {unread > 0 && (
                    <Button
                        variant="outline"
                        onClick={handleMarkAll}
                        loading={marking}
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            ) : notifications.length === 0 ? (
                <EmptyState
                    title="No notifications"
                    description="Updates about offers, jobs and reviews will appear here."
                />
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`flex items-start gap-4 p-4 ${
                                !notification.is_read ? "bg-indigo-50/50" : ""
                            }`}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                <Icon name="bell" className="h-5 w-5" />
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-semibold text-slate-900">
                                        {notification.title}
                                    </h3>
                                    {!notification.is_read && (
                                        <Badge color="blue">New</Badge>
                                    )}
                                </div>
                                <p className="mt-0.5 text-sm text-slate-600">
                                    {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    {formatDateTime(notification.created_at)}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                                {!notification.is_read && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleMarkOne(notification.id)
                                        }
                                        title="Mark as read"
                                        aria-label="Mark as read"
                                        className="rounded-lg p-2.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        <Icon
                                            name="check"
                                            className="h-5 w-5"
                                        />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDelete(notification.id)
                                    }
                                    title="Delete notification"
                                    aria-label="Delete notification"
                                    className="rounded-lg p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Icon name="trash" className="h-5 w-5" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <div className="mt-6">
                <Link
                    to={ROLE_DASHBOARD[user?.role]}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    Back to dashboard
                </Link>
            </div>
        </div>
    );
}

export default Notifications;