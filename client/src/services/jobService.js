import api from "./api";


export const fetchMyJobs = async () => {
    const response = await api.get("/jobs/my");

    return response.data;
};


export const fetchJob = async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);

    return response.data;
};


export const startJob = async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/start`);

    return response.data;
};


export const completeJob = async (jobId) => {
    const response = await api.post(`/jobs/${jobId}/complete`);

    return response.data;
};