import api from '../services/api';


const sessionMaterialAPI = {
  bulk: (payload, options = {}) => {
    const params = {};
    if (options.replace) params.replace = true;
    if (options.dedupe) params.dedupe = true;
    return api.post('staff/session-materials/bulk', payload, { params });
  },
  getAll: (params = {}) => {
    return api.get('staff/session-materials', { params });
  },
  exportExcel: (params = {}) =>
    api.get('staff/session-materials/export-excel', {
      params,
      responseType: 'blob',
    }),
};

export default sessionMaterialAPI;
