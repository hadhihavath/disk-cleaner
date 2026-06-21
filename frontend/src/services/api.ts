import { 
  Drive, FileItem, FolderItem, DuplicateGroup, SoftwareItem, 
  TempCategory, DownloadsAnalysis, RecommendationResponse, 
  CleanupLog, ScanHistory, Settings, ScanProgress 
} from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Request failed with status ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

export const api = {
  // Drives
  getDrives: () => request<Drive[]>('/drives'),
  getDriveInfo: (drive: string) => request<Drive>(`/drive-info/${drive}`),
  
  // Scanning
  startScan: (drive: string) => request<{ status: string; drive: string }>('/scan', {
    method: 'POST',
    body: JSON.stringify({ drive }),
  }),
  stopScan: () => request<{ status: string }>('/stop-scan', { method: 'POST' }),
  getScanProgress: () => request<ScanProgress>('/scan-progress'),
  
  // Results
  getLargeFiles: () => request<FileItem[]>('/large-files'),
  getLargeFolders: () => request<FolderItem[]>('/large-folders'),
  getDuplicates: () => request<DuplicateGroup[]>('/duplicates'),
  getSoftware: () => request<SoftwareItem[]>('/software'),
  getTempFiles: () => request<Record<string, TempCategory>>('/temp-files'),
  getDownloadsAnalysis: () => request<DownloadsAnalysis>('/downloads-analysis'),
  getRecommendations: () => request<RecommendationResponse>('/recommendations'),
  
  // Actions
  deleteFiles: (paths: string[]) => request<{ path: string; status: string; error: string | null; bytes_reclaimed: number }[]>('/delete-files', {
    method: 'POST',
    body: JSON.stringify({ paths }),
  }),
  cleanupTemp: (categories: string[]) => request<{ status: string; bytes_reclaimed: number; details: any[] }>('/cleanup-temp', {
    method: 'POST',
    body: JSON.stringify({ categories }),
  }),
  emptyRecycleBin: () => request<{ status: string; error: string | null }>('/empty-recycle-bin', {
    method: 'POST',
  }),
  
  // Stats and settings
  getLogs: (limit?: number) => request<CleanupLog[]>(`/logs${limit ? `?limit=${limit}` : ''}`),
  getScanHistory: (limit?: number) => request<ScanHistory[]>(`/scan-history${limit ? `?limit=${limit}` : ''}`),
  getSettings: () => request<Settings>('/settings'),
  updateSetting: (key: string, value: string) => request<{ status: string }>('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  }),
  
  // Reports
  getReports: () => request<{ name: string; path: string; size: number; created_at: string }[]>('/reports'),
  exportReport: (format: 'html' | 'csv') => request<{ status: string; filepath: string }>(`/export-report?format=${format}`, {
    method: 'POST',
  }),
};

// WebSocket progress helper
export function connectProgressWebSocket(onMessage: (progress: ScanProgress) => void): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws/scan-progress`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as ScanProgress;
      onMessage(data);
    } catch (e) {
      console.error("Error parsing WebSocket message", e);
    }
  };
  
  ws.onerror = (err) => {
    console.error("WebSocket progress error", err);
  };
  
  return ws;
}
