import axios from 'axios';

// VITE_BACKEND_URL injected at build time via deploy-frontend.yml (per branch)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || ''}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
