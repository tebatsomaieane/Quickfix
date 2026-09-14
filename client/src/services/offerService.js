import api from "./api";


// ==========================================
// LIST MY OFFERS (provider)
// ==========================================
export const fetchMyOffers = async () => {
    const response = await api.get("/offers/my");

    return response.data;
};


// ==========================================
// SUBMIT AN OFFER (provider)
// ==========================================
export const createOffer = async (offerData) => {
    const response = await api.post("/offers", offerData);

    return response.data;
};


// ==========================================
// EDIT A PENDING OFFER (provider)
// ==========================================
export const updateOffer = async (offerId, offerData) => {
    const response = await api.put(`/offers/${offerId}`, offerData);

    return response.data;
};


// ==========================================
// WITHDRAW A PENDING OFFER (provider)
// ==========================================
export const withdrawOffer = async (offerId) => {
    const response = await api.post(`/offers/${offerId}/withdraw`);

    return response.data;
};


// ==========================================
// ACCEPT AN OFFER (customer)
// ==========================================
export const acceptOffer = async (offerId) => {
    const response = await api.post(`/offers/${offerId}/accept`);

    return response.data;
};