// API base URL comes from runtime config (public/config.js → window.__HYLE_CONFIG__),
// so one build can be deployed to any environment without rebuilding. Falls back to
// same-origin :3000 for `ng serve` if config.js is absent.
declare global {
  interface Window {
    __HYLE_CONFIG__?: { apiBaseUrl?: string };
  }
}

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const runtime = window.__HYLE_CONFIG__?.apiBaseUrl;
    if (runtime) return runtime.replace(/\/$/, '');
    return window.location.origin.replace(/:\d+/, ':3000');
  }
  return 'http://localhost:3000';
}

export const environment = {
  apiBaseUrl: resolveApiBaseUrl(),
};
