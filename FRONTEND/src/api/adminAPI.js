import api from "../services/api";

const adminAPI = {
  getAll: (params) => api.get("/manage/admin/accounts", { params }),
  create: (data) => api.post("/manage/admin/accounts", data),
  update: (id, data) => api.put(`/manage/admin/accounts/${id}`, data),
  delete: (id) => api.delete(`/manage/admin/accounts/${id}`),

  toggleStatus: (id) => api.put(`/manage/admin/accounts/${id}/toggle-status`), 
};

export default adminAPI;
