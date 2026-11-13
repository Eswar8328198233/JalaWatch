import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitNewReport, SubmitReportPayload } from './api';

export type OfflineSyncStatus = 'draft' | 'pending' | 'syncing' | 'failed' | 'submitted';

export interface OfflineReport {
  localId: string;
  createdAt: string;
  data: SubmitReportPayload;
  photoUri?: string;
  syncStatus: OfflineSyncStatus;
  syncError?: string;
  serverReportId?: string;
}

const STORAGE_KEY = '@jalawatch_offline_reports_v2';

/**
 * Retrieve all locally saved reports and drafts
 */
export async function getOfflineReports(): Promise<OfflineReport[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Offline] Failed to read offline reports from AsyncStorage:', err);
    return [];
  }
}

/**
 * Save or queue a new report draft
 */
export async function saveOfflineReport(
  payload: {
    data: SubmitReportPayload;
    photoUri?: string;
    syncStatus?: OfflineSyncStatus;
  }
): Promise<OfflineReport> {
  const current = await getOfflineReports();
  const newReport: OfflineReport = {
    localId: `DRAFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    data: payload.data,
    photoUri: payload.photoUri,
    syncStatus: payload.syncStatus || 'pending',
  };

  const updated = [newReport, ...current];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newReport;
}

/**
 * Update an existing offline report
 */
export async function updateOfflineReport(
  localId: string,
  updates: Partial<OfflineReport>
): Promise<void> {
  const current = await getOfflineReports();
  const updated = current.map((r) => {
    if (r.localId === localId) {
      return { ...r, ...updates };
    }
    return r;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Delete a local report or discard draft
 */
export async function deleteOfflineReport(localId: string): Promise<void> {
  const current = await getOfflineReports();
  const filtered = current.filter((r) => r.localId !== localId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Clear all submitted reports from the offline queue
 */
export async function clearSubmittedOfflineReports(): Promise<void> {
  const current = await getOfflineReports();
  const active = current.filter((r) => r.syncStatus !== 'submitted');
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(active));
}

/**
 * Attempt to sync a single offline report to the server
 */
export async function syncSingleReport(
  localId: string
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  const reports = await getOfflineReports();
  const target = reports.find((r) => r.localId === localId);

  if (!target) {
    return { success: false, error: 'Report draft not found.' };
  }

  // If already submitted, don't submit again
  if (target.syncStatus === 'submitted' && target.serverReportId) {
    return { success: true, reportId: target.serverReportId };
  }

  // Set syncing status
  await updateOfflineReport(localId, { syncStatus: 'syncing', syncError: undefined });

  try {
    const res = await submitNewReport(target.data, target.photoUri);
    // Mark as submitted
    await updateOfflineReport(localId, {
      syncStatus: 'submitted',
      serverReportId: res.report_id,
      syncError: undefined,
    });
    return { success: true, reportId: res.report_id };
  } catch (err: any) {
    const errorMsg = err.message || 'Network sync failed';
    await updateOfflineReport(localId, {
      syncStatus: 'failed',
      syncError: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Sync all pending or failed reports in the background
 */
export async function syncAllPendingReports(): Promise<{ synced: number; failed: number }> {
  const reports = await getOfflineReports();
  const queue = reports.filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'failed');

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    const res = await syncSingleReport(item.localId);
    if (res.success) {
      synced += 1;
    } else {
      failed += 1;
    }
  }

  return { synced, failed };
}
