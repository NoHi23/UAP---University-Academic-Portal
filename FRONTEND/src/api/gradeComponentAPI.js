import api from '../services/api';

const gradeComponentAPI = {
  bulk: (payload, subjectId) =>
    api.post('staff/grade-components/bulk?subjectId=' + subjectId, payload),
  exportExcel: (subjectId) =>
    api.get('staff/grade-components/export-excel', {
      params: { subjectId },
      responseType: 'blob',
    }),
  getAll: (subjectId) =>
    api.get('staff/grade-components', { params: { subjectId } }),
};

export default gradeComponentAPI;
