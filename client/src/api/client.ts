import { ApiError } from '../types';

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
};

const BASE_URL = getBaseUrl();

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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('tbr_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorPayload: ApiError = data?.error || {
      code: 'REQUEST_FAILED',
      message: response.statusText || 'Network request failed',
    };
    throw new ClientApiError(errorPayload.code, errorPayload.message, errorPayload.details);
  }

  return data as T;
}
