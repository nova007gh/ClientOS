const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.token) {
    headers['Authorization'] = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      (data as any)?.message ?? 'Request failed',
      res.status,
      data,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => apiFetch<T>(path, { token }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    apiFetch<T>(path, { method: 'POST', body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    apiFetch<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string | null) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
};
