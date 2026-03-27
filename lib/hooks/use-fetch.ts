'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  skip?: boolean;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useFetch<T = any>(
  url: string,
  options?: UseFetchOptions
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!options?.skip);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        credentials: 'include',
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erro ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      setData(json.data !== undefined ? json.data : json);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [url, options?.method, options?.body, options?.headers]);

  useEffect(() => {
    if (!options?.skip) {
      fetchData();
    }
  }, [fetchData, options?.skip]);

  return { data, error, loading, refetch: fetchData };
}

export async function apiPost<T = any>(
  url: string,
  body: any
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: json.error || `Erro ${res.status}` };
    }
    return { data: json.data !== undefined ? json.data : json };
  } catch (err: any) {
    return { error: err.message || 'Erro de rede' };
  }
}

export async function apiPut<T = any>(
  url: string,
  body: any
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: json.error || `Erro ${res.status}` };
    }
    return { data: json.data !== undefined ? json.data : json };
  } catch (err: any) {
    return { error: err.message || 'Erro de rede' };
  }
}

export async function apiDelete(
  url: string
): Promise<{ error?: string }> {
  try {
    const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      return { error: json?.error || `Erro ${res.status}` };
    }
    return {};
  } catch (err: any) {
    return { error: err.message || 'Erro de rede' };
  }
}

export async function apiPatch<T = any>(
  url: string,
  body: any
): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      return { error: json.error || `Erro ${res.status}` };
    }
    return { data: json.data !== undefined ? json.data : json };
  } catch (err: any) {
    return { error: err.message || 'Erro de rede' };
  }
}
