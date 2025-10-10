import api from '../services/api';

const announcementAPI = {
    // 📜 Lấy danh sách tất cả thông báo
    getAll: () => api.get('announcements'),

    // 🔍 Lấy chi tiết 1 thông báo theo ID
    getById: (id) => api.get(`announcements/${id}`),
};

export default announcementAPI;
