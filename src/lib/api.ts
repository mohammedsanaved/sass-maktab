/**
 * Centralized API utility for making authenticated requests.
 * Handles token inclusion and 401 (Unauthorized) redirection.
 */

export async function apiFetch(url: string, options: RequestInit = {}) {
  const getAccessToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  let token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store', // Prevent caching
  });

  if (response.status === 401) {
    // Prevent infinite loop if the refresh endpoint itself fails
    if (url.includes('/api/auth/refresh')) {
       handleLogout();
       throw new Error('Unauthorized');
    }

    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        if (data.accessToken) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', data.accessToken);
          }
          
          // Retry the original request with the new token
          headers.set('Authorization', `Bearer ${data.accessToken}`);
          response = await fetch(url, {
            ...options,
            headers,
            cache: 'no-store',
          });
          
          return response;
        }
      } 
      
      // If refresh fails or no token returned
      handleLogout();
      throw new Error('Unauthorized');
      
    } catch (error) {
       handleLogout();
       throw error; // Re-throw to be handled by caller if needed
    }
  }

  return response;
}

function handleLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    const locale = window.location.pathname.split('/')[1] || 'en';
    window.location.href = `/${locale}/login?expired=true`;
  }
}
