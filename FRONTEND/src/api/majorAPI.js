import api from '../services/api';

const majorAPI = {
    getAll: () => api.get('major'),
};

export default majorAPI;
