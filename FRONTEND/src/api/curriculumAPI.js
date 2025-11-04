import api from '../services/api';

const curriculumAPI = {
    // 📜 Lấy danh sách tất cả chương trình học (curriculums). Accepts optional query params, e.g. { majorId }
    getAll: (params) => api.get('curriculums', { params }),

    // 🔍 Lấy chi tiết 1 chương trình học theo ID
    getById: (id) => api.get(`curriculums/${id}`),

    // 📚 Lấy chi tiết chương trình học với thông tin chi tiết
    getDetails: (id) => api.get(`curriculums/${id}/details`),
    // 📌 Lấy các CurriculumDetail theo subjectId
    getBySubject: (subjectId) => api.get('curriculums/by-subject', { params: { subjectId } }),
};

export default curriculumAPI;
