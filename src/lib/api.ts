// lib/api.ts
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

// Request interceptor
axiosInstance.interceptors.request.use(async (config) => {
  const store = useAuthStore.getState();
  const { accessToken, refreshToken } = store;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (refreshToken) {
    config.headers['x-refresh-token'] = refreshToken;
  }

  return config;
});

let refreshPromise: Promise<boolean> | null = null;
// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest.url?.includes('/auth/refreshAT');
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;
      //if refreshPromise is null =>  create
      if (!refreshPromise) {
        refreshPromise = useAuthStore
          .getState()
          .refreshAccessToken()
          .then((success) => {
            refreshPromise = null;
            return success;
          })
          .catch((err) => {
            console.log(err);
            refreshPromise = null;
            return false;
          });
      }
      try {
        const success = await refreshPromise;
        if (success) {
          const { accessToken } = useAuthStore.getState();
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }
        //if refresh token fail
        useAuthStore.getState().clearTokens();
        window.location.href = '/signin';
        return Promise.reject(error);
      } catch (err) {
        useAuthStore.getState().clearTokens();
        window.location.href = '/signin';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error.response.data.error);
  },
);

// ✅ Đây là hàm mà Orval cần — nó nhận config và trả về promise
export const api = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance.request(config);
};