import type { ApiError } from '@/types/api.types';

// Browser → /api/*  (Next.js proxy route handlers)
// Auth is handled by Clerk session cookies automatically — no manual token needed here.
// Token is only attached server-side in proxyRequest for the Next.js → backend hop.
const BASE = '/api';
const TIMEOUT_MS = 10_000;

/** Internal — not exported. Feature hooks use ListParams or their own extended types. */
type QueryParams = Record<string, string | number | boolean | null | undefined>;

type FetchOptions = {
  method?: string;
  body?: unknown;
  params?: QueryParams;
  headers?: Record<string, string>;
};

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return path;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) qs.set(key, String(value));
  });
  const query = qs.toString();
  return query ? `${path}?${query}` : path;
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, headers } = options;
  const hasBody = body !== undefined;

  const res = await fetch(`${BASE}${buildUrl(path, params)}`, {
    method,
    headers: {
      ...(hasBody && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    // Try to parse Problem Details body, fall back to status text
    const error: ApiError = await res
      .json()
      .catch(() => ({ status: res.status, title: res.statusText }));
    throw error;
  }

  // 204 No Content — nothing to parse
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, params?: QueryParams) => apiFetch<T>(path, { params }),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'DELETE', headers }),
};
