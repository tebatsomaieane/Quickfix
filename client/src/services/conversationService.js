import api from "./api";


export const fetchMyConversations = async () => {
    const response = await api.get("/conversations/my");

    return response.data;
};


export const fetchConversation = async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}`);

    return response.data;
};


export const createOrFindConversation = async (requestId) => {
    const response = await api.post("/conversations", {
        request_id: requestId
    });

    return response.data;
};


export const sendMessage = async (conversationId, message) => {
    const response = await api.post(
        `/conversations/${conversationId}/messages`,
        { message }
    );

    return response.data;
};


export const markConversationRead = async (conversationId) => {
    const response = await api.post(`/conversations/${conversationId}/read`);

    return response.data;
};