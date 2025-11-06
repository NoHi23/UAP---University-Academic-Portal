import api from "../services/api";

const examScheduleAPI = {
  getAll: (params) => api.get("/exam-schedule", { params }),
  create: (data) => api.post("/exam-schedule", data),
  update: (id, data) => api.put(`/exam-schedule/${id}`, data),
  delete: (id) => api.delete(`/exam-schedule/${id}`),
  getById: (id) => api.get(`/exam-schedule/${id}`),
  getCourses: () => api.get("/exam-schedule/courses"),  // Lấy danh sách môn học
  getRooms: () => api.get("/exam-schedule/rooms"),    // Lấy danh sách phòng thi
};

export default examScheduleAPI;
