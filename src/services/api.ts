// REST API client with automatic token injection and error formatting

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('novara_token');

  const isFormDataBody = typeof FormData !== 'undefined' && customConfig.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormDataBody
    ? {}
    : { 'Content-Type': 'application/json' };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    ...customConfig,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) =>
    apiFetch<T>(endpoint, { method: 'GET', params }),

  post: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    }),

  put: <T = any>(endpoint: string, body?: any) =>
    apiFetch<T>(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    }),

  delete: <T = any>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};
