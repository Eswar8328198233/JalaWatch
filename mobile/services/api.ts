import { Platform } from 'react-native';
import Constants from 'expo-constants';

let userConfiguredBaseUrl: string | null = null;

const DEV_LAN_IP = '192.168.29.89';
const FALLBACK_LAN_IP = '192.168.31.108';

/**
 * Production cloud backend URL on Render.
 * Prioritized by default in production and general app usage.
 */
export const PRODUCTION_API_URL = 'https://jalawatch.onrender.com';

/**
 * Allows the user or UI to set a custom backend URL dynamically
 * (e.g. current laptop IP or a cloud HTTPS domain) without rebuilding the app.
 */
export function setApiBaseUrl(url: string): void {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `http://${cleanUrl}`;
  }
  userConfiguredBaseUrl = cleanUrl;
  currentBaseUrl = cleanUrl;
  API_BASE = cleanUrl;
}

/**
 * Build prioritized list of candidate endpoints:
 * 0. User manually configured in app UI
 * 1. Explicit environment variable override (EXPO_PUBLIC_API_URL)
 * 2. Production Render cloud backend (Default primary)
 * 3. Dynamic host IP from Metro connection (only in development)
 * 4. Local development fallbacks (LAN IP, Android emulator 10.0.2.2, USB adb reverse 127.0.0.1)
 */
export const getCandidateUrls = (): string[] => {
  const candidates: string[] = [];

  // 0. User manually configured in app settings
  if (userConfiguredBaseUrl) {
    candidates.push(userConfiguredBaseUrl);
  }

  // 1. Explicit environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, ''));
  }

  // 2. Production Render cloud backend (Default primary for production builds)
  candidates.push(PRODUCTION_API_URL);

  // 3. Dynamic host IP from Metro connection (if present in local development)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      candidates.push(`http://${hostIp}:5000`);
    }
  }

  // 4. Current active local network Wi-Fi IP (for physical phone on same Wi-Fi)
  candidates.push(`http://${DEV_LAN_IP}:5000`);

  // 5. Android Emulator loopback alias (maps emulator to host machine localhost)
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:5000');
  }

  // 6. USB cable with ADB reverse (works on physical phone via: adb reverse tcp:5000 tcp:5000)
  candidates.push('http://127.0.0.1:5000');

  // 7. Previous LAN IP fallback
  candidates.push(`http://${FALLBACK_LAN_IP}:5000`);

  // 8. Localhost fallback
  candidates.push('http://localhost:5000');

  return Array.from(new Set(candidates));
};

const CANDIDATE_URLS = getCandidateUrls();
let currentBaseUrl = CANDIDATE_URLS[0];

export let API_BASE = currentBaseUrl;

export function getApiBaseUrl(): string {
  return currentBaseUrl;
}

/**
 * Returns appropriate timeout in milliseconds.
 * Cloud instances (e.g. Render free tier) require up to 35-45s when waking up from cold sleep.
 * Local LAN / USB connections respond in under 3.5s.
 */
function getTimeoutForUrl(url: string): number {
  const isCloud = url.startsWith('https://') || url.includes('onrender.com');
  return isCloud ? 38000 : 3500;
}

/**
 * Tests connection to a specific backend URL using the /api/health endpoint
 */
export async function testEndpoint(baseUrl: string): Promise<{ ok: boolean; status: number; message: string }> {
  try {
    let cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    const timeoutMs = getTimeoutForUrl(cleanUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${cleanUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const isCloud = cleanUrl.includes('onrender.com');
      return {
        ok: true,
        status: res.status,
        message: `Connected: ${data.service || 'JalaWatch API'} (${data.status})${isCloud ? ' [Render Cloud]' : ''}`,
      };
    }
    return { ok: false, status: res.status, message: `Server returned HTTP ${res.status}` };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
    return {
      ok: false,
      status: 0,
      message: isTimeout
        ? 'Connection timed out. If Render was sleeping, please wait a moment for the instance to wake up.'
        : (err.message || 'Connection failed'),
    };
  }
}

/**
 * Smart fetch helper that automatically tries candidate URLs.
 * Mutating requests target currentBaseUrl only to prevent accidental duplicate submissions.
 */
async function fetchWithEndpointFallback(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const isMutation = init?.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method.toUpperCase());

  const candidates = isMutation
    ? [currentBaseUrl]
    : [
      currentBaseUrl,
      ...getCandidateUrls().filter((c) => c !== currentBaseUrl),
    ];

  const failedAttempts: string[] = [];

  for (const candidate of candidates) {
    try {
      const timeoutMs = getTimeoutForUrl(candidate);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${candidate}${path}`, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status < 500) {
        currentBaseUrl = candidate;
        API_BASE = candidate;
        return res;
      } else {
        failedAttempts.push(`${candidate} (HTTP ${res.status})`);
      }
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      failedAttempts.push(`${candidate} (${isTimeout ? 'Timed out / Waking up' : 'Refused/Unreachable'})`);
    }
  }

  const isCloudPrimary = currentBaseUrl.includes('onrender.com') || currentBaseUrl.startsWith('https://');
  const cloudHint = isCloudPrimary
    ? `\n\nNote: If the Render cloud backend was idle, it may take 30-40 seconds to spin up on cold start. Please tap 'Retry Connection'.`
    : `\n\nCheck that Flask is running on 0.0.0.0:5000 or switch to production: ${PRODUCTION_API_URL}`;

  throw new Error(
    `Backend unreachable. Attempted endpoints:\n${failedAttempts.map((f) => `• ${f}`).join('\n')}${cloudHint}`
  );
}

// ----------------- Reverse Geocoding Cache & Service ----------------- //

export interface GeocodeAddress {
  village: string;
  district: string;
  state: string;
  street: string;
  landmark: string;
  display_name: string;
}

const _clientGeoCache = new Map<string, GeocodeAddress>();

/**
 * Reverse geocodes coordinates (lat, lng) to human-readable address components.
 * Prioritizes the backend reverse geocode proxy with in-memory caching,
 * with graceful fallback to Nominatim directly if offline or waking up.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeAddress> {
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  const cacheKey = `${roundedLat},${roundedLng}`;

  if (_clientGeoCache.has(cacheKey)) {
    return _clientGeoCache.get(cacheKey)!;
  }

  // 1. Try backend API proxy
  try {
    const res = await fetchWithEndpointFallback(`/api/geocode/reverse?lat=${roundedLat}&lng=${roundedLng}`);
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        _clientGeoCache.set(cacheKey, data.address);
        return data.address;
      }
    }
  } catch (backendErr) {
    console.warn('[Geocode] Backend proxy unreachable, falling back to direct OSM:', backendErr);
  }

  // 2. Direct OpenStreetMap Nominatim fallback
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: { 'User-Agent': 'JalaWatch-Mobile-Community-Water-App/1.0 (nutakki-csp@jalawatch.org)' },
    });
    if (res.ok) {
      const raw = await res.json();
      const addr = raw.address || {};
      const parsed: GeocodeAddress = {
        village:
          addr.village ||
          addr.hamlet ||
          addr.town ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.city_district ||
          addr.county ||
          addr.city ||
          '',
        district: addr.state_district || addr.district || addr.county || '',
        state: addr.state || 'Andhra Pradesh',
        street: addr.road || addr.residential || addr.pedestrian || addr.footway || '',
        landmark: addr.amenity || addr.building || addr.natural || addr.landmark || addr.shop || addr.place || '',
        display_name: raw.display_name || `${roundedLat}° N, ${roundedLng}° E`,
      };
      _clientGeoCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch (fallbackErr) {
    console.warn('[Geocode] Direct Nominatim geocoding failed:', fallbackErr);
  }

  // 3. Graceful fallback
  const fallback: GeocodeAddress = {
    village: '',
    district: '',
    state: 'Andhra Pradesh',
    street: '',
    landmark: '',
    display_name: `${roundedLat}° N, ${roundedLng}° E`,
  };
  _clientGeoCache.set(cacheKey, fallback);
  return fallback;
}

// ----------------- Types & Interfaces ----------------- //

export interface ReportFollowupNote {
  id: number;
  report_id: string;
  officer_id?: string;
  officer_name: string;
  note: string;
  created_at: string;
}

export interface Report {
  id: string;
  village: string;
  district?: string;
  state?: string;
  category: string;
  water_source?: string;
  date_observed: string;
  landmark?: string;
  description: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  reporter_name?: string;
  status: 'Submitted' | 'Under Review' | 'Resolved' | 'Archived';
  is_verified?: boolean;
  is_demo?: boolean;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigned_to?: string;
  water_appearance?: string;
  water_smell?: string;
  water_usage?: string;
  issue_duration?: string;
  nearby_wastewater?: string;
  suspected_distance?: string;
  additional_notes?: string;
  // Lab parameters
  ph?: number;
  tds?: number;
  fluoride?: number;
  nitrate?: number;
  e_coli?: string;
  lab_name?: string;
  testing_date?: string;
  sample_collection_date?: string;
  report_reference_no?: string;
  lab_status?: string;
  lab_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminReport extends Report {
  admin_notes?: string;
  reporter_contact?: string;
}

export interface Stats {
  total_reports: number;
  submitted: number;
  under_review: number;
  resolved: number;
  archived?: number;
  verified?: number;
  villages_impacted: number;
  category_breakdown: { category: string; count: number }[];
  top_villages: { village: string; count: number }[];
  priority_breakdown?: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface SubmitReportPayload {
  village: string;
  district?: string;
  state?: string;
  category: string;
  water_source?: string;
  date_observed: string;
  landmark?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  reporter_name?: string;
  reporter_contact?: string;
  water_appearance?: string;
  water_smell?: string;
  water_usage?: string;
  issue_duration?: string;
  nearby_wastewater?: string;
  suspected_distance?: string;
  additional_notes?: string;
  priority?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: 'super_admin' | 'admin' | 'field_officer';
  phone?: string;
}

export interface AdminActivityLog {
  id: number;
  admin_id: string;
  username: string;
  action: string;
  report_id?: string;
  previous_status?: string;
  new_status?: string;
  details?: string;
  timestamp: string;
}

// ----------------- Public API Endpoints ----------------- //

/**
 * Fetch public reports list with optional filters
 */
export async function fetchReports(filters?: {
  search?: string;
  category?: string;
  village?: string;
  status?: string;
  priority?: string;
  limit?: number;
}): Promise<Report[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category && filters?.category !== 'All') params.append('category', filters.category);
    if (filters?.village && filters?.village !== 'All') params.append('village', filters.village);
    if (filters?.status && filters?.status !== 'All') params.append('status', filters.status);
    if (filters?.priority && filters?.priority !== 'All') params.append('priority', filters.priority);
    if (filters?.limit) params.append('limit', String(filters.limit));

    const path = `/api/reports?${params.toString()}`;
    const res = await fetchWithEndpointFallback(path);

    if (!res.ok) {
      throw new Error(`Failed to load reports (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.reports || [];
  } catch (err: any) {
    console.warn('[API] fetchReports error:', err.message);
    throw err;
  }
}

/**
 * Fetch a single report by ID
 */
export async function fetchReportById(reportId: string): Promise<Report> {
  try {
    const path = `/api/reports/${encodeURIComponent(reportId)}`;
    const res = await fetchWithEndpointFallback(path);
    if (!res.ok) {
      throw new Error(`Report ${reportId} not found (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.report;
  } catch (err: any) {
    console.warn(`[API] fetchReportById(${reportId}) error:`, err.message);
    throw err;
  }
}

/**
 * Fetch overall statistics
 */
export async function fetchStats(): Promise<Stats> {
  try {
    const res = await fetchWithEndpointFallback('/api/stats');
    if (!res.ok) {
      throw new Error(`Failed to load stats (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[API] fetchStats error:', err.message);
    throw err;
  }
}

/**
 * Submit a new report with optional photo and extended environmental survey fields
 */
export async function submitNewReport(
  payload: SubmitReportPayload,
  photoUri?: string
): Promise<{ report_id: string; message: string; duplicate_warning?: any; priority?: string }> {
  const formData = new FormData();

  formData.append('village', payload.village);
  if (payload.district) formData.append('district', payload.district);
  if (payload.state) formData.append('state', payload.state);
  formData.append('category', payload.category);
  if (payload.water_source) formData.append('water_source', payload.water_source);
  formData.append('date_observed', payload.date_observed);
  if (payload.landmark) formData.append('landmark', payload.landmark);
  formData.append('description', payload.description);
  if (payload.latitude !== undefined) formData.append('latitude', String(payload.latitude));
  if (payload.longitude !== undefined) formData.append('longitude', String(payload.longitude));
  if (payload.reporter_name) formData.append('reporter_name', payload.reporter_name);
  if (payload.reporter_contact) formData.append('reporter_contact', payload.reporter_contact);

  // Extended environmental observation fields
  if (payload.water_appearance) formData.append('water_appearance', payload.water_appearance);
  if (payload.water_smell) formData.append('water_smell', payload.water_smell);
  if (payload.water_usage) formData.append('water_usage', payload.water_usage);
  if (payload.issue_duration) formData.append('issue_duration', payload.issue_duration);
  if (payload.nearby_wastewater) formData.append('nearby_wastewater', payload.nearby_wastewater);
  if (payload.suspected_distance) formData.append('suspected_distance', payload.suspected_distance);
  if (payload.additional_notes) formData.append('additional_notes', payload.additional_notes);
  if (payload.priority) formData.append('priority', payload.priority);

  if (photoUri) {
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
    };
    const type = mimeMap[ext] || 'image/jpeg';

    // @ts-ignore - React Native FormData accepts { uri, name, type }
    formData.append('photo', {
      uri: photoUri,
      name: filename,
      type,
    });
  }

  const res = await fetchWithEndpointFallback('/api/reports', {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data.error || 'Failed to submit report';
    throw new Error(msg);
  }

  return data;
}

/**
 * Resolves uploaded photo URL against active baseUrl if relative
 */
export function getFullPhotoUrl(relativeOrAbsoluteUrl?: string): string | null {
  if (!relativeOrAbsoluteUrl) return null;
  if (relativeOrAbsoluteUrl.startsWith('http://') || relativeOrAbsoluteUrl.startsWith('https://')) {
    return relativeOrAbsoluteUrl;
  }
  return `${currentBaseUrl}${relativeOrAbsoluteUrl}`;
}

// ----------------- Administration API Endpoints ----------------- //

/**
 * Admin Login: Authenticates and returns JWT token and admin info
 */
export async function adminLogin(
  username: string,
  password: string
): Promise<{ token: string; admin: AdminUser }> {
  const res = await fetchWithEndpointFallback('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid admin credentials');
  }
  return { token: data.token, admin: data.admin };
}

/**
 * Verify current admin token & retrieve role information
 */
export async function adminGetMe(token: string): Promise<AdminUser> {
  const res = await fetchWithEndpointFallback('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Session expired. Please log in again.');
  }
  return data.admin;
}

/**
 * Admin Get Reports with extended filters (village, priority, assigned_to)
 */
export async function adminGetReports(
  token: string,
  filters?: {
    search?: string;
    status?: string;
    category?: string;
    village?: string;
    priority?: string;
    assigned_to?: string;
    sort_by?: string;
  }
): Promise<AdminReport[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters?.status !== 'All') params.append('status', filters.status);
  if (filters?.category && filters?.category !== 'All') params.append('category', filters.category);
  if (filters?.village && filters?.village !== 'All') params.append('village', filters.village);
  if (filters?.priority && filters?.priority !== 'All') params.append('priority', filters.priority);
  if (filters?.assigned_to && filters?.assigned_to !== 'All') params.append('assigned_to', filters.assigned_to);
  if (filters?.sort_by) params.append('sort_by', filters.sort_by);

  const res = await fetchWithEndpointFallback(`/api/admin/reports?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch admin reports');
  }
  return data.reports || [];
}

/**
 * Admin Update Report Status
 */
export async function adminUpdateReportStatus(
  token: string,
  reportId: string,
  payload: { status?: string; admin_notes?: string; is_verified?: boolean }
): Promise<AdminReport> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update report status');
  }
  return data.report;
}

/**
 * Admin Update Report Priority
 */
export async function adminUpdatePriority(
  token: string,
  reportId: string,
  priority: string
): Promise<AdminReport> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}/priority`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ priority }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update report priority');
  }
  return data.report;
}

/**
 * Admin Assign Report to Officer
 */
export async function adminAssignReport(
  token: string,
  reportId: string,
  assignedTo: string
): Promise<AdminReport> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}/assign`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ assigned_to: assignedTo }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to assign officer');
  }
  return data.report;
}

/**
 * Get internal follow-up notes for a report
 */
export async function adminGetNotes(token: string, reportId: string): Promise<ReportFollowupNote[]> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}/notes`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load follow-up notes');
  }
  return data.notes || [];
}

/**
 * Add an internal follow-up note
 */
export async function adminAddNote(token: string, reportId: string, note: string): Promise<ReportFollowupNote> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}/notes`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ note }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save follow-up note');
  }
  return data.note;
}

/**
 * Record certified laboratory test results
 */
export async function adminUpdateLabTest(
  token: string,
  reportId: string,
  payload: {
    ph?: number | null;
    tds?: number | null;
    fluoride?: number | null;
    nitrate?: number | null;
    e_coli?: string;
    lab_name?: string;
    testing_date?: string;
    sample_collection_date?: string;
    report_reference_no?: string;
    lab_status?: string;
    is_verified?: boolean;
    lab_notes?: string;
  }
): Promise<AdminReport> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}/lab-test`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update lab test data');
  }
  return data.report;
}

/**
 * Super Admin: Delete a report
 */
export async function adminDeleteReport(token: string, reportId: string): Promise<void> {
  const res = await fetchWithEndpointFallback(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete report');
  }
}

/**
 * Super Admin: List all administrator and officer accounts
 */
export async function adminGetUsers(token: string): Promise<AdminUser[]> {
  const res = await fetchWithEndpointFallback('/api/admin/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch users');
  }
  return data.users || [];
}

/**
 * Super Admin: Create a new administrator or officer account
 */
export async function adminCreateUser(
  token: string,
  payload: { username: string; password: string; role: string; email?: string; phone?: string }
): Promise<AdminUser> {
  const res = await fetchWithEndpointFallback('/api/admin/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create user account');
  }
  return data.user;
}

/**
 * Super Admin: Update user account role
 */
export async function adminUpdateUserRole(
  token: string,
  userId: string,
  role: string
): Promise<void> {
  const res = await fetchWithEndpointFallback(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update user role');
  }
}

/**
 * Admin: Change self password
 */
export async function adminChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetchWithEndpointFallback('/api/admin/change-password', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update password');
  }
}

/**
 * Analytics: Hotspots & cluster surveillance
 */
export async function adminGetHotspots(): Promise<any> {
  const res = await fetchWithEndpointFallback('/api/admin/analytics/hotspots', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch hotspots analytics');
  }
  return data;
}

/**
 * Field Operations: Duplicate clusters within 150m
 */
export async function adminGetDuplicateClusters(token: string): Promise<any[]> {
  const res = await fetchWithEndpointFallback('/api/admin/reports/duplicates', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load duplicate clusters');
  }
  return data.clusters || [];
}

/**
 * Audit Trail: Admin activity logs
 */
export async function adminGetLogs(
  token: string,
  filters?: { report_id?: string; limit?: number }
): Promise<AdminActivityLog[]> {
  const params = new URLSearchParams();
  if (filters?.report_id) params.append('report_id', filters.report_id);
  if (filters?.limit) params.append('limit', String(filters.limit));

  const res = await fetchWithEndpointFallback(`/api/admin/logs?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load activity logs');
  }
  return data.logs || [];
}

/**
 * Admin Export CSV: Downloads or fetches CSV report export from /api/admin/export
 */
export async function adminExportCsv(token: string): Promise<string> {
  const res = await fetchWithEndpointFallback('/api/admin/export', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/csv, application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to export CSV (HTTP ${res.status})`);
  }

  return await res.text();
}
