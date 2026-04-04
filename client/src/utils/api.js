import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stockhive_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      localStorage.removeItem('stockhive_token');
      localStorage.removeItem('stockhive_user');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (status === 403) {
      return Promise.reject(err);
    }

    if (!err.response) {
      console.error('[StockHive] Network error — server unreachable:', err.message);
    }

    return Promise.reject(err);
  }
);

export default api;
