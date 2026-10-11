const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('randomify_token') : null;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
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

  return response.json() as Promise<T>;
}
