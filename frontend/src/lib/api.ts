import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL });

// Automatically attach Firebase token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ihsan_idToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      localStorage.removeItem('ihsan_idToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
