import axios from 'axios';
import toast from 'react-hot-toast';
import { auth } from '../firebase.js';

/**
 * Backend origin. In production the API lives on the SAME Vercel deployment
 * (/api/* serverless function), so this is empty — same-origin requests, no
 * CORS, no separate cold host. VITE_BACKEND_URL still overrides it (local dev
 * or a split deployment); in dev it falls back to the local backend port.
 */
export const API_BASE: string =
  import.meta.env.VITE_BACKEND_URL ?? (import.meta.env.DEV ? 'http://localhost:5001' : '');

const api = axios.create({ baseURL: API_BASE });

/**
 * Returns a valid Firebase ID token, or null for guests.
 * auth.currentUser.getIdToken() serves a cached token and transparently
 * refreshes it when it is about to expire (Firebase tokens live 1 hour) —
 * this is what keeps long sessions from 401-ing.
 * The localStorage copy is only a fallback for the brief window before
 * Firebase has restored the session on a hard reload.
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      localStorage.setItem('ihsan_idToken', token);
      return token;
    } catch {
      /* fall through to cached copy */
    }
  }
  return localStorage.getItem('ihsan_idToken');
}

// Attach a fresh Firebase token to every request
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — only redirect if the user HAD a session (it expired
// server-side or was revoked). Guest users (no Firebase session) simply get
// the rejected promise back without a redirect.
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const hadSession = !!auth.currentUser || !!localStorage.getItem('ihsan_idToken');
      localStorage.removeItem('ihsan_idToken');
      if (hadSession && auth.currentUser === null) {
        window.location.href = '/login';
      }
    }
    // Rate limited — tell the user instead of failing silently.
    // Fixed toast id so a burst of 429s shows a single message.
    if (axios.isAxiosError(err) && err.response?.status === 429) {
      toast.error('Too many requests — please wait a moment and try again.', { id: 'rate-limit', duration: 4000 });
    }
    return Promise.reject(err);
  }
);

export default api;
