import api from '../services/api';

const materialAPI = {
  create: (payload) => api.post('staff/materials', payload),
  getAll: (params) => api.get('staff/materials', { params }),
  // options: { replace: boolean, dedupe: boolean }
  bulk: (payload, options = {}) => {
    const params = {};
    if (options.replace) params.replace = true;
    if (options.dedupe) params.dedupe = true;
    return api.post('staff/materials/bulk', payload, { params });
  },
  update: (id, payload) => api.put(`staff/materials/${id}`, payload),
  remove: (id) => api.delete(`staff/materials/${id}`),
};

export default materialAPI;
