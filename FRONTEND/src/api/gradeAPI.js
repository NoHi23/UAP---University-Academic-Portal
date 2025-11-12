import api from '../services/api';

const gradeAPI = {
  // payload: array of items or { items: [...] }
  import: (payload) => api.post('lecturer/grades/import', payload),
  mark: (payload) => api.post('lecturer/grades/mark', payload),
  // export class grades as xlsx; try staff endpoint first and fall back to lecturer endpoint
  exportClassExcel: async (subjectId, classId) => {
    const params = { subjectId, classId };
    // Prefer lecturer endpoint for lecturer clients; fallback to staff if lecturer endpoint unavailable
    try {
      return await api.get('lecturer/grades/export-class', { params, responseType: 'blob' });
    } catch (err) {
      // fallback to staff endpoint
      return await api.get('staff/grades/export-class', { params, responseType: 'blob' });
    }
  }
};

export default gradeAPI;
