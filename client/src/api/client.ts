import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types';

let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:4000/api';
};

export const BASE_URL = getBaseUrl();

export class ClientApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ClientApiError';
    this.code = code;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Send httpOnly cookies (refreshToken)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach in-memory access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

// Response interceptor: handle 401 with silent token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints (login, register, refresh itself)
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const serverError = err.response?.data?.error;
    if (serverError && typeof serverError.message === 'string') {
      return serverError.message;
    }
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.message) {
      return err.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// Typed generic helper for backward compatibility
export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    params?: any;
  } = {}
): Promise<T> {
  try {
    const res = await api.request<T>({
      url: endpoint,
      method: (options.method || 'GET') as any,
      data: options.body,
      headers: options.headers,
      params: options.params,
    });
    return res.data;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const payload: ApiError = err.response?.data?.error || {
        code: err.code || 'API_ERROR',
        message: err.message,
      };
      throw new ClientApiError(payload.code, payload.message, payload.details);
    }
    throw err;
  }
}
