// src/api.js
import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.')
);

const localBaseURL = typeof window !== 'undefined' && window.location.hostname
  ? `http://${window.location.hostname}:8000/api/`
  : 'http://127.0.0.1:8000/api/';

const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const hasPlaceholder = rawEnvUrl.includes('<') || rawEnvUrl.includes('>');
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
// If loaded over HTTPS (like Vercel production), any localhost/127.0.0.1 URL is invalid and causes Mixed Content blocks
const isUnusableEnv = isHttps && (rawEnvUrl.includes('localhost') || rawEnvUrl.includes('127.0.0.1') || rawEnvUrl.startsWith('http://'));

let resolvedBaseURL = '';
if (rawEnvUrl && !hasPlaceholder && !isUnusableEnv) {
  resolvedBaseURL = rawEnvUrl;
} else if (isLocal) {
  resolvedBaseURL = localBaseURL;
} else {
  resolvedBaseURL = 'https://ai-job-portal-so5e.onrender.com/api/';
}

// Ensure proper trailing slash and /api/ route prefix
if (!resolvedBaseURL.endsWith('/')) {
  resolvedBaseURL += '/';
}
if (!resolvedBaseURL.endsWith('/api/')) {
  resolvedBaseURL = resolvedBaseURL.replace(/\/?$/, '/api/');
}

export const API_BASE_URL = resolvedBaseURL;
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout to accommodate Render free-tier cold starts
});

// Interceptor to inject JWT Access Token into Request Headers
API.interceptors.request.use((config) => {
  // Never send an Authorization header to public auth registration or login endpoints
  if (config.url?.includes('auth/register') || config.url?.includes('auth/login')) {
    if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
    return config;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to automatically refresh expired access tokens
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh');

      // If we have a refresh token and this isn't already the refresh endpoint
      if (refreshToken && !originalRequest.url?.includes('auth/token/refresh/')) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return API(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem('token', newAccessToken);
          if (res.data.refresh) {
            localStorage.setItem('refresh', res.data.refresh);
          }
          API.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return API(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refresh');
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      // Public endpoints retry without authorization header
      if (originalRequest.url?.includes('chatbot') || originalRequest.url?.startsWith('jobs/')) {
        originalRequest._retry = true;
        delete originalRequest.headers.Authorization;
        return API(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
