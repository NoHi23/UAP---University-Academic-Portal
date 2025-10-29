import api from '../services/api';

const curriculumAPI = {
    // 📜 Lấy danh sách tất cả chương trình học (curriculums)
    getAll: () => api.get('curriculums'),

    // 🔍 Lấy chi tiết 1 chương trình học theo ID
    getById: (id) => api.get(`curriculums/${id}`),

    // 📚 Lấy chi tiết chương trình học với thông tin chi tiết
    getDetails: (id) => api.get(`curriculums/${id}/details`),
};

export default curriculumAPI;
