import api from "./api";


export const fetchMyNotifications = async () => {
    const response = await api.get("/notifications/my");

    return response.data;
};


export const markNotificationRead = async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);

    return response.data;
};


export const deleteNotification = async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);

    return response.data;
};


export const markAllNotificationsRead = async () => {
    const response = await api.post("/notifications/read");

    return response.data;
};