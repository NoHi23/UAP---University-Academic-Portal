import api from "../services/api";

const announcementAPI = {
  getAll: (params = {}) => api.get("announcements", { params }),
  getById: (id) => api.get(`announcements/${id}`),
  create: (data) => api.post("announcements", data),
};

export default announcementAPI;
