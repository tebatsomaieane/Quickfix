import api from "./api";


export const fetchMyComplaints = async () => {
    const response = await api.get("/complaints/my");

    return response.data;
};


export const createComplaint = async (complaintData) => {
    const response = await api.post("/complaints", complaintData);

    return response.data;
};