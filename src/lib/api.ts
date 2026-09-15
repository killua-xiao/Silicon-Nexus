const KEY = 'nexus_operator_key';
const LEGACY = 'nexus_api_key';

export function getOperatorKey(): string {
  return localStorage.getItem(KEY) || localStorage.getItem(LEGACY) || '';
}

export function setOperatorKey(key: string) {
  localStorage.setItem(KEY, key);
  localStorage.removeItem(LEGACY);
}

export function clearOperatorKey() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(LEGACY);
}

export type ApiErrorHandler = (message: string) => void;

let onUnauthorized: (() => void) | null = null;
let onError: ApiErrorHandler | null = null;

export function setApiHandlers(handlers: { onUnauthorized?: () => void; onError?: ApiErrorHandler }) {
  onUnauthorized = handlers.onUnauthorized || null;
  onError = handlers.onError || null;
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getOperatorKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['X-API-Key'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    onUnauthorized?.();
  }
  return response;
}

export async function apiJson<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const res = await apiFetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string; message?: string }).error
      || (data as { message?: string }).message
      || `Request failed (${res.status})`;
    onError?.(message);
    throw new Error(message);
  }
  return data as T;
}
