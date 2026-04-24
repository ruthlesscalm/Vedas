import axios from 'axios';

const api = axios.create({
  // Use the full URL from environment variables in production,
  // proxy through /api in development
  baseURL: import.meta.env.PROD
    ? import.meta.env.VITE_API_URL
    : '/api',
  withCredentials: true,
});

export default api;
