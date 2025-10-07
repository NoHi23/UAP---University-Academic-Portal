import api from '../services/api';

const staffAPI = {
    // ===========================
    // STUDENT ACCOUNT
    // ===========================
    createStudentAccount: (data) => {
        return api.post('staff/accounts/students', data);
    },

    getStudentById: (id) => {
        return api.get(`staff/student/${id}`);
    },

    listStudents: (params = {}) => {
        // Có thể truyền params để filter/sort, ví dụ: ?major=IT&class=HE2022
        return api.get('staff/students', { params });
    },

    updateStudent: (id, data) => {
        return api.put(`staff/student/${id}`, data);
    },

    deleteStudent: (id) => {
        return api.delete(`staff/student/${id}`);
    },

    // ===========================
    // LECTURER ACCOUNT
    // ===========================
    createLecturerAccount: (data) => {
        return api.post('staff/accounts/lecturers', data);
    },

    getLecturerById: (id) => {
        return api.get(`staff/lecturer/${id}`);
    },

    listLecturers: (params = {}) => {
        return api.get('staff/lecturers', { params });
    },

    updateLecturer: (id, data) => {
        return api.put(`staff/lecturer/${id}`, data);
    },

    deleteLecturer: (id) => {
        return api.delete(`staff/lecturer/${id}`);
    },
};

export default staffAPI;
