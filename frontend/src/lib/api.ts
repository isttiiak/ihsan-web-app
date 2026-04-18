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

// Handle 401 globally — only redirect if the user HAD a token (session expired)
// Guest users (no token) make unauthenticated requests that return 401 — don't redirect them
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const hadToken = !!localStorage.getItem('ihsan_idToken');
      localStorage.removeItem('ihsan_idToken');
      if (hadToken) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
