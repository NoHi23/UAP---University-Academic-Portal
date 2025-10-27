import api from '../services/api';

const BASE_URL = '/manage/users';

const staffAPI = {
    // ===========================
    //  STUDENT ACCOUNT
    // ===========================

    //  Tạo sinh viên mới
    createStudentAccount: (data) => {
        return api.post(`${BASE_URL}/students`, data);
    },

    //  Import sinh viên bằng Excel
    importStudentsExcel: (formData) => {
        // Let the browser/axios set the Content-Type with correct boundary
        return api.post(`${BASE_URL}/students/import-excel`, formData);
    },

    //  Lấy danh sách sinh viên
    listStudents: (params = {}) => {
        return api.get(`${BASE_URL}/students`, { params });
    },

    //  Lấy chi tiết 1 sinh viên
    getStudentById: (id) => {
        return api.get(`${BASE_URL}/students/${id}`);
    },

    //  Cập nhật thông tin sinh viên
    updateStudent: (id, data) => {
        return api.put(`${BASE_URL}/students/${id}`, data);
    },

    //  Xoá sinh viên
    deleteStudent: (id) => {
        return api.delete(`${BASE_URL}/students/${id}`);
    },

    //  Reset mật khẩu sinh viên
    resetPassword: (id, personalEmail) => {
        return api.post(`${BASE_URL}/resetPassword/${id}`, { personalEmail });
    },

    // ===========================
    //  LECTURER ACCOUNT
    // ===========================

    //  Tạo giảng viên mới
    createLecturerAccount: (data) => {
        return api.post(`${BASE_URL}/lecturers`, data);
    },

    //  Import giảng viên bằng Excel
    importLecturersExcel: (formData) => {
        // Let the browser/axios set the Content-Type with correct boundary
        return api.post(`${BASE_URL}/lecturers/import-excel`, formData);
    },

    //  Lấy danh sách giảng viên
    listLecturers: (params = {}) => {
        return api.get(`${BASE_URL}/lecturers`, { params });
    },

    //  Lấy chi tiết giảng viên
    getLecturerById: (id) => {
        return api.get(`${BASE_URL}/lecturers/${id}`);
    },

    //  Cập nhật giảng viên
    updateLecturer: (id, data) => {
        return api.put(`${BASE_URL}/lecturers/${id}`, data);
    },

    //  Xoá giảng viên
    deleteLecturer: (id) => {
        return api.delete(`${BASE_URL}/lecturers/${id}`);
    },

};

export default staffAPI;
