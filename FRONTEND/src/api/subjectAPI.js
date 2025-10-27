import api from '../services/api';

const subjectAPI = {
  create: (payload) => api.post('staff/subjects', payload),
  getAll: (params) => api.get('staff/subjects', { params }),
  getById: (id) => api.get(`staff/subjects/${id}`),
  update: (id, payload) => api.put(`staff/subjects/${id}`, payload),
};

export default subjectAPI;
