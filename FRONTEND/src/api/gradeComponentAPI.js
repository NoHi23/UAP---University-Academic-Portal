import api from '../services/api';

const gradeComponentAPI = {
  bulk: (payload, subjectId) =>
    api.post('staff/grade-components/bulk?subjectId=' + subjectId, payload),
  exportExcel: (subjectId) =>
    api.get('staff/grade-components/export-excel', {
      params: { subjectId },
      responseType: 'blob',
    }),
  // getAll: prefer lecturer endpoint (query param) for lecturer clients, fallback to staff path if needed
  getAll: async (subjectId) => {
    if (!subjectId) return api.get('lecturer/grade-components');
    try {
      // lecturer route accepts ?subjectId=
      return await api.get('lecturer/grade-components', { params: { subjectId } });
    } catch (err) {
      // fallback to staff route which uses path param: /staff/:subjectId/grade-components
      return await api.get(`staff/${subjectId}/grade-components`);
    }
  },
};

export default gradeComponentAPI;
