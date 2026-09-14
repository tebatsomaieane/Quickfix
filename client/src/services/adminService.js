import api from "./api";


export const fetchStats = async () => {
    const response = await api.get("/admin/stats");

    return response.data;
};


export const fetchComplaints = async () => {
    const response = await api.get("/admin/complaints");

    return response.data;
};


export const updateComplaint = async (complaintId, data) => {
    const response = await api.patch(`/admin/complaints/${complaintId}`, data);

    return response.data;
};


export const fetchVerification = async () => {
    const response = await api.get("/admin/verification");

    return response.data;
};


export const reviewVerification = async (requestId, data) => {
    const response = await api.patch(`/admin/verification/${requestId}`, data);
    return response.data;
};


export const fetchBusinesses = async () => {
    const response = await api.get("/admin/businesses");
    return response.data;
};


export const reviewBusinessVerification = async (businessId, data) => {
    const response = await api.patch(`/admin/businesses/${businessId}`, data);
    return response.data;
};


export const fetchUsers = async (params = {}) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
};


export const updateUser = async (userId, data) => {
    const response = await api.patch(`/admin/users/${userId}`, data);
    return response.data;
};


export const fetchAdminProviders = async (params = {}) => {
    const response = await api.get("/admin/providers", { params });
    return response.data;
};