/**
 * Centralized API utility for making authenticated requests.
 * Handles token inclusion and 401 (Unauthorized) redirection.
 */

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      // Extract locale from pathname if possible, otherwise default to current
      const locale = window.location.pathname.split('/')[1] || 'en';
      window.location.href = `/${locale}/login?expired=true`;
    }
    throw new Error('Unauthorized');
  }

  return response;
}
