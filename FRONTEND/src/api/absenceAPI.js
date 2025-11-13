import api from "../services/api";

const absenceAPI = {
  // Gửi đơn xin nghỉ học
  createRequest: (payload) => api.post("/absence", payload),

  // Sinh viên xem đơn của mình
  getMyAbsences: (params = {}) => api.get("/absence/me", { params }),

  // Staff/Admin xem toàn bộ đơn
  getAll: (params = {}) => api.get("/absence", { params }),

  // Lấy chi tiết đơn
  getById: (id) => api.get(`/absence/${id}`),

  // Duyệt hoặc từ chối
  review: (id, status) => api.put(`/absence/${id}/review`, { status }),

  // ✅ Lấy danh sách kỳ học
  getSemesters: () => api.get("/absence/semesters"),
};

export default absenceAPI;
