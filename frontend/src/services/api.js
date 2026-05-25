import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  console.warn("WARNING: NEXT_PUBLIC_API_URL is not set. Please set it in your .env.local file. Falling back to localhost for development only.");
}

const api = axios.create({
  baseURL: baseURL || 'http://localhost:8000/api',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ims_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
