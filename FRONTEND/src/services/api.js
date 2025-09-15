import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9999/api/',
});

// Thêm một interceptor để tự động gắn token vào header mỗi khi gửi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;