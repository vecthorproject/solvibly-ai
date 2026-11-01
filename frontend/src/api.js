import axios from 'axios';

// The frontend calls relative "/api/..." URLs. In production they work when the static host forwards
// /api to the backend (a Render rewrite rule) or when VITE_API_URL is set at build time. If neither is
// in place the host answers with its own HTML (or a 404): the app then switches to the known backend.
export const PRODUCTION_API = 'https://solvibly-ai.onrender.com';

export function configureApiBase() {
  axios.defaults.baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
}

function canFallBack() {
  return import.meta.env.PROD && !axios.defaults.baseURL && window.location.origin !== PRODUCTION_API;
}

const looksLikeStatus = (data) => !!data && typeof data === 'object' && 'enabled' in data;

export async function fetchArchiveStatus() {
  try {
    const { data } = await axios.get('/api/archive/status');
    if (looksLikeStatus(data)) return data;
  } catch (err) {
    if (!(err?.response?.status === 404 && canFallBack())) throw err;
  }
  if (!canFallBack()) throw new Error('Risposta inattesa dal server.');
  axios.defaults.baseURL = PRODUCTION_API;
  const { data } = await axios.get('/api/archive/status');
  return data;
}
