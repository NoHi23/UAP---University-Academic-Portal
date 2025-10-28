import api from '../services/api';

const cloAPI = {
  bulk: (payload, options = {}) => {
    const params = {};
    if (options.replace) params.replace = true;
    if (options.dedupe) params.dedupe = true;
    return api.post('staff/clos/bulk', payload, { params });
  },
  getAll: (params = {}) => {
    return api.get('staff/clos', { params });
  }
};

export default cloAPI;
