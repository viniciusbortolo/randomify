const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export interface ApiFetchOptions extends RequestInit {
  timeout?: number;
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('randomify_token') : null;

  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('x-timezone') && typeof window !== 'undefined') {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone) {
        headers.set('x-timezone', timeZone);
      }
    } catch {
      // ignore
    }
  }

  if (!headers.has('Accept-Language') && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('randomify_locale');
      if (saved) {
        headers.set('Accept-Language', saved === 'pt-BR' ? 'pt-BR,pt;q=0.9' : 'en-US,en;q=0.9');
      } else if (navigator.language) {
        headers.set('Accept-Language', navigator.language);
      }
    } catch {
      // ignore
    }
  }

  const { timeout = 15000, signal: customSignal, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (customSignal) {
    customSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Tempo limite de conexão esgotado (timeout)');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
