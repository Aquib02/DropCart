// Base API URL configured via environment variable for production (Render)
// and fallback to localhost:5000 for local development.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
