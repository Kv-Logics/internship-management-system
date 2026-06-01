import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  console.warn("WARNING: NEXT_PUBLIC_API_URL is not set. Please set it in your .env.local file. Falling back to localhost for development only.");
}

const api = axios.create({
  baseURL: baseURL || 'http://127.0.0.1:8000/api',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log(`[AXIOS INTERCEPTOR] Request to ${config.url}, Token: ${token ? token.substring(0, 15) + '...' : 'null'}`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/auth/callback') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
