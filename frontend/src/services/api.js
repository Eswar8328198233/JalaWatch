// JalaWatch Frontend API Service
export const PRODUCTION_API_URL = 'https://jalawatch.onrender.com';

// Smart API_BASE resolution:
// 1. Explicit VITE_API_URL environment variable (if defined)
// 2. Production build defaults to PRODUCTION_API_URL (Render HTTPS)
// 3. Local development defaults to '' to leverage Vite's local dev proxy
export const API_BASE = (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== '')
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : (import.meta.env.PROD ? PRODUCTION_API_URL : '');

/**
 * Normalizes photo URLs so images load properly regardless of whether they
 * are relative (/uploads/...), hosted on Cloudinary (https://res.cloudinary.com/...),
 * or served from the production Flask backend.
 */
export function getPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  const base = API_BASE || PRODUCTION_API_URL;
  return `${base}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
}

/**
 * Helper to perform fetch requests with timeout and error handling.
 * Accounts for Render free-tier cold-start wake-up delays (up to 38s).
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  // Set Content-Type only if body is NOT FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Allow up to 38s timeout for cloud endpoints (Render cold start)
  const isCloud = url.startsWith('https://') || url.includes('onrender.com');
  const timeoutMs = options.timeout || (isCloud ? 38000 : 5000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(
        'The JalaWatch server took longer than usual to respond. If the server was idle, it may be waking up. Please retry in a few moments.'
      );
    }
    throw new Error(
      err.message || 'Unable to connect to the JalaWatch server. Please check your internet connection.'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'An error occurred');
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data?.details || null;
    throw error;
  }

  return data;
}

// ----------------- Public APIs ----------------- //

export async function checkHealth() {
  return request('/api/health');
}

export async function getStats() {
  return request('/api/stats');
}

export async function getReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters.village && filters.village !== 'All') params.append('village', filters.village);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/reports${queryString}`);
}

export async function getReportById(reportId) {
  return request(`/api/reports/${reportId}`);
}

export async function submitReport(formData) {
  return request('/api/reports', {
    method: 'POST',
    body: formData, // FormData instance
  });
}

// ----------------- Admin Auth & Management APIs ----------------- //

export async function adminLogin(username, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getAdminMe(token) {
  return request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminReports(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.category && filters.category !== 'All') params.append('category', filters.category);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/admin/reports${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateAdminReportStatus(token, reportId, payload) {
  return request(`/api/admin/reports/${reportId}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminReport(token, reportId) {
  return request(`/api/admin/reports/${reportId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getExportUrl(token) {
  return `${API_BASE}/api/admin/export?token=${encodeURIComponent(token)}`;
}
