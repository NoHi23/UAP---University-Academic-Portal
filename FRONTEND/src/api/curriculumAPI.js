import api from "../services/api";

const curriculumAPI = {
  getAll: (params) => api.get("/manage/admin/curriculums", { params }),
  create: (data) => api.post("/manage/admin/curriculums", data),
  update: (id, data) => api.put(`/manage/admin/curriculums/${id}`, data),
  delete: (id) => api.delete(`/manage/admin/curriculums/${id}`),
};

export default curriculumAPI;
