const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function api(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Request failed (${response.status}).`);
  return payload;
}

export const encoded = (value) => encodeURIComponent(value);
