const API_KEY = import.meta.env.VITE_API_KEY || '';

export const apiHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
  ...extra,
});

export const wsUrl = (path = '/ws/threats') => {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const base = `${protocol}//${window.location.host}${path}`;
  if (!API_KEY) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(API_KEY)}`;
};

export const isApiKeyConfigured = () => Boolean(API_KEY);
