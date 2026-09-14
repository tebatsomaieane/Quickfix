import api from "./api";


export const updateProviderProfile = async (data) => {
    const response = await api.patch("/providers/me", data);
    return response.data;
};


export const updateProviderServices = async (services) => {
    const response = await api.put("/providers/me/services", { services });
    return response.data;
};


export const updateProviderAvailability = async (availability) => {
    const response = await api.put("/providers/me/availability", { availability });
    return response.data;
};