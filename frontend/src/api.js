// src/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';

const API = axios.create({
  baseURL,
});

// Interceptor to inject JWT Access Token into Request Headers
API.interceptors.request.use((config) => {
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
          const res = await axios.post(`${baseURL}auth/token/refresh/`, {
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
