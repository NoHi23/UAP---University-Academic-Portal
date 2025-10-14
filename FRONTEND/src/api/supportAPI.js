// src/api/supportAPI.js
import api from "../services/api"; // axios instance đã cấu hình sẵn baseURL + interceptors

export const SUPPORT_STATUS = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    CLOSED: "closed",
};

const supportAPI = {
    getAll: (params = {}) => api.get("/support", { params }),
    getById: (id) => api.get(`/support/${id}`),
    getByAccount: (accountId, params = {}) =>
        api.get(`/support/account/${accountId}`, { params }),
    createRequest: (payload) => api.post("/support/request", payload),
    answer: (id, answer) => api.put(`/support/${id}/answer`, { answer }),
    updateStatus: (id, status) => api.put(`/support/${id}/status`, { status }),
};

export default supportAPI;
