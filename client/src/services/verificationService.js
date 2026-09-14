import api from "./api";


export const fetchVerificationStatus = async () => {
    const response = await api.get("/provider/verification");

    return response.data;
};


export const requestVerification = async (data) => {
    const response = await api.post("/provider/verification", data);

    return response.data;
};