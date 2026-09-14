import api from "./api";


// ==========================================
// CATEGORIES
// ==========================================
export const fetchCategories = async (options = {}) => {
    const params = new URLSearchParams();

    if (options.withServices) {
        params.set("with", "services");
    }

    const query = params.toString();

    const response = await api.get(
        `/categories${query ? `?${query}` : ""}`
    );

    return response.data;
};


export const fetchCategory = async (categoryId) => {
    const response = await api.get(`/categories/${categoryId}`);

    return response.data;
};


// ==========================================
// SERVICES
// ==========================================
export const fetchServices = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.categoryId) {
        params.set("category_id", filters.categoryId);
    }

    if (filters.category) {
        params.set("category", filters.category);
    }

    if (filters.search) {
        params.set("q", filters.search);
    }

    const query = params.toString();

    const response = await api.get(
        `/services${query ? `?${query}` : ""}`
    );

    return response.data;
};


export const fetchService = async (serviceId) => {
    const response = await api.get(`/services/${serviceId}`);

    return response.data;
};


// ==========================================
// PROVIDERS
// ==========================================
export const fetchProviders = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.search) {
        params.set("q", filters.search);
    }

    if (filters.serviceId) {
        params.set("service_id", filters.serviceId);
    }

    if (filters.categoryId) {
        params.set("category_id", filters.categoryId);
    }

    if (filters.verified) {
        params.set("verified", "true");
    }

    const query = params.toString();

    const response = await api.get(
        `/providers${query ? `?${query}` : ""}`
    );

    return response.data;
};


export const fetchProvider = async (providerId) => {
    const response = await api.get(`/providers/${providerId}`);

    return response.data;
};


export const fetchMyProviderProfile = async () => {
    const response = await api.get("/providers/me");

    return response.data;
};


// ==========================================
// PRODUCTS (advertised by businesses)
// ==========================================
export const fetchProducts = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.categoryId) {
        params.set("category_id", filters.categoryId);
    }

    if (filters.businessId) {
        params.set("business_id", filters.businessId);
    }

    if (filters.search) {
        params.set("q", filters.search);
    }

    const query = params.toString();

    const response = await api.get(
        `/products${query ? `?${query}` : ""}`
    );

    return response.data;
};


export const fetchProduct = async (productId) => {
    const response = await api.get(`/products/${productId}`);

    return response.data;
};


// ==========================================
// MARKET OVERVIEW
// ==========================================
export const fetchMarketSummary = async () => {
    const response = await api.get("/market/summary");

    return response.data;
};


export const fetchActivePromotions = async () => {
    const response = await api.get("/market/promotions");

    return response.data;
};


export const fetchActiveAdvertisements = async () => {
    const response = await api.get("/market/advertisements");

    return response.data;
};


export const fetchMarketOverview = async () => {
    const response = await api.get("/market/overview");

    return response.data;
};