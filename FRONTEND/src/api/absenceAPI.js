import api from "../services/api";

const absenceAPI = {
  createRequest: (payload) => api.post("/absence", payload),
  getMyAbsences: (params = {}) => api.get("/absence/me", { params }),
  getAll: (params = {}) => api.get("/absence", { params }),
  getById: (id) => api.get(`/absence/${id}`),
  review: (id, status) => api.put(`/absence/${id}/review`, { status }),
};

export default absenceAPI;
