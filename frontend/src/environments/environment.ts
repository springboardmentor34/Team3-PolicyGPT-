/**
 * Environment configuration for PolicyGPT Frontend.
 *
 * Automatically resolves the backend API URL:
 * 1. If running on localhost / 127.0.0.1 -> http://127.0.0.1:8000
 * 2. If running on Vercel / Netlify / Cloud:
 *    a. Checks localStorage.getItem('POLICYGPT_API_URL') for user override
 *    b. Checks window.__env?.API_URL if injected
 *    c. Defaults to the Render backend web service URL
 */

export function getBackendApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Local Docker or local ng serve
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return 'http://127.0.0.1:8000';
    }

    // Dynamic runtime override via localStorage
    const saved = localStorage.getItem('POLICYGPT_API_URL');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/$/, '');
    }

    // Dynamic runtime override via window.__env
    const envApi = (window as any).__env?.API_URL;
    if (envApi && envApi.trim()) {
      return envApi.trim().replace(/\/$/, '');
    }
  }

  // Default cloud backend URL on Render
  return 'https://team3-policygpt-backend.onrender.com';
}

export function setBackendApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('POLICYGPT_API_URL');
    } else {
      localStorage.setItem('POLICYGPT_API_URL', url.trim().replace(/\/$/, ''));
    }
  }
}

// Expose on window for easy testing/troubleshooting from browser console
if (typeof window !== 'undefined') {
  (window as any).setPolicyGptBackend = setBackendApiUrl;
}

export const environment = {
  production: false,
  get apiUrl(): string {
    return getBackendApiUrl();
  }
};
