'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from './api-client';
import { useAuthStore } from './auth-store';

interface ResourceState<T> {
  data: T[];
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useResource<T>(path: string): ResourceState<T> {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get<{ data: T[] } | T[]>(path, accessToken);
        if (cancelled) return;
        setData(Array.isArray(res) ? res : (res.data ?? []));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load data');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    if (accessToken) load();
    else setLoading(true);

    return () => {
      cancelled = true;
    };
  }, [path, accessToken, nonce]);

  return { data, loading, error, refetch };
}
