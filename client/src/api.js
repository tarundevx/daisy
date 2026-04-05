import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
// Derived socket URL: if VITE_API_BASE_URL is 'https://api.com/api', SOCKET_URL is 'https://api.com'
// if VITE_API_BASE_URL is '/api', SOCKET_URL is window.location.origin
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
  : window.location.origin;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically add token to headers if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('daisy_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { API_BASE_URL, SOCKET_URL };
export default api;
