import axios from "axios";
const API = (process.env.REACT_APP_API_URL || "http://localhost:9999").replace(/\/+$/, "");

const instance = axios.create({
  baseURL: `${API}/api/manage/majors`,  // Đảm bảo URL là đúng với API quản lý ngành
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const majorAdminAPI = {
  list: (params) => instance.get("/", { params }),
  create: (data) => instance.post("/", data),
  update: (id, data) => instance.put(`/${id}`, data),
  delete: (id) => instance.delete(`/${id}`),
  toggle: (id) => instance.patch(`/${id}/toggle`),

  // Lấy chương trình đào tạo của ngành
  getCurriculum: (majorId) => instance.get(`/curriculum/${majorId}`),

  // Lấy danh sách môn học
  getSubjects: () => instance.get(`/subjects`),

  // Thêm môn học vào chương trình đào tạo của ngành
  addSubjectToCurriculum: (data) => instance.post(`/curriculum/add`, data),
};

export default majorAdminAPI;
