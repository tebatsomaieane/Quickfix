import api from "./api";


export const fetchProfile = async () => {
    const response = await api.get("/business/profile");
    return response.data;
};


export const updateProfile = async (data) => {
    const response = await api.put("/business/profile", data);
    return response.data;
};


export const fetchMyProducts = async () => {
    const response = await api.get("/business/products");
    return response.data;
};


export const createProduct = async (data) => {
    const response = await api.post("/business/products", data);
    return response.data;
};


export const updateProduct = async (productId, data) => {
    const response = await api.put(`/business/products/${productId}`, data);
    return response.data;
};


export const deleteProduct = async (productId) => {
    const response = await api.delete(`/business/products/${productId}`);
    return response.data;
};


export const fetchMyAdvertisements = async () => {
    const response = await api.get("/business/advertisements");
    return response.data;
};


export const createAdvertisement = async (data) => {
    const response = await api.post("/business/advertisements", data);
    return response.data;
};


export const updateAdvertisement = async (adId, data) => {
    const response = await api.put(`/business/advertisements/${adId}`, data);
    return response.data;
};


export const deleteAdvertisement = async (adId) => {
    const response = await api.delete(`/business/advertisements/${adId}`);
    return response.data;
};


export const fetchMyPromotions = async () => {
    const response = await api.get("/business/promotions");
    return response.data;
};


export const createPromotion = async (data) => {
    const response = await api.post("/business/promotions", data);
    return response.data;
};


export const updatePromotion = async (promoId, data) => {
    const response = await api.put(`/business/promotions/${promoId}`, data);
    return response.data;
};


export const deletePromotion = async (promoId) => {
    const response = await api.delete(`/business/promotions/${promoId}`);
    return response.data;
};


export const fetchAnalytics = async () => {
    const response = await api.get("/business/analytics");
    return response.data;
};


export const requestVerification = async () => {
    const response = await api.post("/business/verification");
    return response.data;
};