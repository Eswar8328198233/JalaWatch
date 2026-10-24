import { Platform } from 'react-native';
import Constants from 'expo-constants';

let userConfiguredBaseUrl: string | null = null;

const DEV_LAN_IP = '192.168.29.89';
const FALLBACK_LAN_IP = '192.168.31.108';

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

// Build list of candidate endpoints to auto-connect whether on Wi-Fi, Emulator (10.0.2.2), or USB (127.0.0.1)
export const getCandidateUrls = (): string[] => {
  const candidates: string[] = [];

  // 0. User manually configured in app
  if (userConfiguredBaseUrl) {
    candidates.push(userConfiguredBaseUrl);
  }

  // 1. Explicit environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, ''));
  }

  // 2. Dynamic host IP from Metro connection (if present in development)
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

  // 3. Current active local network Wi-Fi IP (for physical phone on same Wi-Fi)
  candidates.push(`http://${DEV_LAN_IP}:5000`);

  // 4. Android Emulator loopback alias (maps emulator to host machine localhost)
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:5000');
  }

  // 5. USB cable with ADB reverse (works on physical phone via: adb reverse tcp:5000 tcp:5000)
  candidates.push('http://127.0.0.1:5000');

  // 6. Previous LAN IP fallback
  candidates.push(`http://${FALLBACK_LAN_IP}:5000`);

  // 7. Localhost fallback
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
 * Tests connection to a specific backend URL using the /api/health endpoint
 */
export async function testEndpoint(baseUrl: string): Promise<{ ok: boolean; status: number; message: string }> {
  try {
    let cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${cleanUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { ok: true, status: res.status, message: `Connected: ${data.service || 'JalaWatch API'} (${data.status})` };
    }
    return { ok: false, status: res.status, message: `Server returned HTTP ${res.status}` };
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
    return {
      ok: false,
      status: 0,
      message: isTimeout ? 'Connection timed out (no response in 3s)' : (err.message || 'Connection failed'),
    };
  }
}

/**
 * Smart fetch helper that automatically tries candidate URLs
 * (seamlessly switching between Wi-Fi LAN, Emulator 10.0.2.2, and USB adb reverse)
 */
async function fetchWithEndpointFallback(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const candidates = getCandidateUrls();
  const orderedCandidates = [
    currentBaseUrl,
    ...candidates.filter((c) => c !== currentBaseUrl),
  ];

  const failedAttempts: string[] = [];

  for (const candidate of orderedCandidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

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
      failedAttempts.push(`${candidate} (${isTimeout ? 'Timed out' : 'Refused/Unreachable'})`);
    }
  }

  throw new Error(
    `Backend unreachable. Attempted endpoints:\n${failedAttempts.map((f) => `• ${f}`).join('\n')}\n\n` +
    `Check that Flask is running ('python app.py') on host 0.0.0.0:5000 and your device is on the same network.`
  );
}

export interface Report {
  id: string;
  village: string;
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
  created_at: string;
  updated_at: string;
  is_demo?: boolean;
}

export interface Stats {
  total_reports: number;
  submitted: number;
  under_review: number;
  resolved: number;
  villages_impacted: number;
  category_breakdown: { category: string; count: number }[];
  top_villages: { village: string; count: number }[];
}

export interface SubmitReportPayload {
  village: string;
  category: string;
  water_source?: string;
  date_observed: string;
  landmark?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  reporter_name?: string;
  reporter_contact?: string;
}

/**
 * Fetch public reports list with optional filters
 */
export async function fetchReports(filters?: {
  search?: string;
  category?: string;
  village?: string;
  status?: string;
  limit?: number;
}): Promise<Report[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category && filters?.category !== 'All') params.append('category', filters.category);
    if (filters?.village && filters?.village !== 'All') params.append('village', filters.village);
    if (filters?.status && filters?.status !== 'All') params.append('status', filters.status);
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
 * Submit a new report with optional photo
 */
export async function submitNewReport(
  payload: SubmitReportPayload,
  photoUri?: string
): Promise<{ report_id: string; message: string }> {
  const formData = new FormData();

  formData.append('village', payload.village);
  formData.append('category', payload.category);
  if (payload.water_source) formData.append('water_source', payload.water_source);
  formData.append('date_observed', payload.date_observed);
  if (payload.landmark) formData.append('landmark', payload.landmark);
  formData.append('description', payload.description);
  if (payload.latitude) formData.append('latitude', String(payload.latitude));
  if (payload.longitude) formData.append('longitude', String(payload.longitude));
  if (payload.reporter_name) formData.append('reporter_name', payload.reporter_name);
  if (payload.reporter_contact) formData.append('reporter_contact', payload.reporter_contact);

  if (photoUri) {
    const filename = photoUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // @ts-ignore - React Native FormData expects uri, name, type
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

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface AdminReport extends Report {
  admin_notes?: string;
  reporter_contact?: string;
}

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
 * Admin Get Reports: Retrieves reports including private admin_notes and reporter_contact
 */
export async function adminGetReports(
  token: string,
  filters?: { search?: string; status?: string; category?: string }
): Promise<AdminReport[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters?.status !== 'All') params.append('status', filters.status);
  if (filters?.category && filters?.category !== 'All') params.append('category', filters.category);

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
 * Admin Update Report Status: Updates status, admin notes, or verification mark
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

