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
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/reports${queryString}`);
}

const _clientGeoCache = new Map();

/**
 * Reverse geocodes latitude & longitude into structured address components:
 * village/locality, district, state, street, landmark, and display_name.
 * Employs client-side LRU in-memory caching to comply with rate limits.
 */
export async function reverseGeocode(lat, lng) {
  const roundedLat = Number(Number(lat).toFixed(4));
  const roundedLng = Number(Number(lng).toFixed(4));
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (_clientGeoCache.has(cacheKey)) {
    return _clientGeoCache.get(cacheKey);
  }

  try {
    const data = await request(`/api/geocode/reverse?lat=${roundedLat}&lng=${roundedLng}`);
    if (data && data.address) {
      _clientGeoCache.set(cacheKey, data.address);
      return data.address;
    }
  } catch (err) {
    console.warn('Backend reverse geocode fallback to direct Nominatim lookup:', err);
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`;
      const res = await fetch(nomUrl, {
        headers: { 'User-Agent': 'JalaWatch-Community-Water-Portal/1.0 (nutakki-csp@jalawatch.org)' }
      });
      if (res.ok) {
        const raw = await res.json();
        const addr = raw.address || {};
        const parsed = {
          village: addr.village || addr.hamlet || addr.town || addr.suburb || addr.neighbourhood || addr.city_district || addr.county || addr.city || '',
          district: addr.state_district || addr.district || addr.county || '',
          state: addr.state || 'Andhra Pradesh',
          street: addr.road || addr.residential || addr.pedestrian || addr.footway || '',
          landmark: addr.amenity || addr.building || addr.natural || addr.landmark || addr.shop || addr.place || '',
          display_name: raw.display_name || `${roundedLat}° N, ${roundedLng}° E`
        };
        _clientGeoCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch (fallbackErr) {
      console.warn('Direct Nominatim geocoding also unreachable:', fallbackErr);
    }
  }

  // Graceful fallback coordinates
  const fallback = {
    village: '',
    district: '',
    state: 'Andhra Pradesh',
    street: '',
    landmark: '',
    display_name: `${roundedLat}° N, ${roundedLng}° E`
  };
  _clientGeoCache.set(cacheKey, fallback);
  return fallback;
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
  if (filters.village && filters.village !== 'All') params.append('village', filters.village);
  if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
  if (filters.assigned_to && filters.assigned_to !== 'All') params.append('assigned_to', filters.assigned_to);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);

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

export async function updateAdminReportPriority(token, reportId, priority) {
  return request(`/api/admin/reports/${reportId}/priority`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ priority }),
  });
}

export async function assignAdminReport(token, reportId, assignedTo) {
  return request(`/api/admin/reports/${reportId}/assign`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ assigned_to: assignedTo }),
  });
}

export async function getAdminReportNotes(token, reportId) {
  return request(`/api/admin/reports/${reportId}/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addAdminReportNote(token, reportId, note) {
  return request(`/api/admin/reports/${reportId}/notes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ note }),
  });
}

export async function updateAdminLabTest(token, reportId, payload) {
  return request(`/api/admin/reports/${reportId}/lab-test`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function getAdminUsers(token) {
  return request('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminUser(token, payload) {
  return request('/api/admin/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminUserRole(token, userId, role) {
  return request(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
}

export async function changeAdminPassword(token, currentPassword, newPassword) {
  return request('/api/admin/change-password', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function getHotspots() {
  return request('/api/admin/analytics/hotspots');
}

export async function getDuplicateClusters(token) {
  return request('/api/admin/reports/duplicates', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminLogs(token, filters = {}) {
  const params = new URLSearchParams();
  if (filters.report_id) params.append('report_id', filters.report_id);
  if (filters.limit) params.append('limit', filters.limit);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/admin/logs${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
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
