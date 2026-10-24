// JalaWatch Frontend API Service
const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Helper to perform fetch requests with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  // Set Content-Type only if body is NOT FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
