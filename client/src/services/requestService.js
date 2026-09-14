import api from "./api";


// ==========================================
// CREATE SERVICE REQUEST
// ==========================================
export const createRequest = async (requestData) => {
    const response = await api.post("/requests", requestData);

    return response.data;
};


// ==========================================
// LIST MY REQUESTS
// ==========================================
export const fetchMyRequests = async () => {
    const response = await api.get("/requests");

    return response.data;
};


// ==========================================
// FETCH A SINGLE REQUEST (with offers)
// ==========================================
export const fetchRequest = async (requestId) => {
    const response = await api.get(`/requests/${requestId}`);

    return response.data;
};


// ==========================================
// CANCEL MY REQUEST (while still open)
// ==========================================
export const cancelRequest = async (requestId) => {
    const response = await api.post(`/requests/${requestId}/cancel`);

    return response.data;
};


// ==========================================
// LIST OPEN REQUESTS (provider - can offer)
// ==========================================
export const fetchAvailableRequests = async () => {
    const response = await api.get("/provider/requests");

    return response.data;
};


// ==========================================
// FETCH OPEN REQUEST DETAIL (provider)
// ==========================================
export const fetchAvailableRequest = async (requestId) => {
    const response = await api.get(`/provider/requests/${requestId}`);

    return response.data;
};