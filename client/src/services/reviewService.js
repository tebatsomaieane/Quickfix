import api from "./api";


export const fetchEligibleReviews = async () => {
    const response = await api.get("/reviews/eligible");

    return response.data;
};


export const createReview = async ({ jobId, rating, comment }) => {
    const response = await api.post("/reviews", {
        job_id: jobId,
        rating,
        comment
    });

    return response.data;
};