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
  (error) => {
    try {
      const status = error?.response?.status;
      const isAdminRoute =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/admin');
      if (status === 401 && isAdminRoute) {
        localStorage.removeItem('token');
        window.location.href = '/admin/login';
      }
    } catch {
      // never let the interceptor itself break the app
    }
    return Promise.reject(error);
  }
);

export default api;
