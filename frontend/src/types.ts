export interface Drive {
  device: string;
  mountpoint: string;
  fstype?: string;
  total: number;
  used: number;
  free: number;
  percent: number;
}

export interface FileItem {
  name: string;
  path: string;
  ext: string;
  size: number;
  mtime: number;
  atime: number;
}

export interface FolderItem {
  name: string;
  path: string;
  size: number;
  percentage: number;
}

export interface DuplicateGroup {
  hash: string;
  size: number;
  original: FileItem;
  duplicates: FileItem[];
}

export interface SoftwareItem {
  name: string;
  publisher: string;
  version: string;
  install_date: string;
  size: number;
  uninstall_string: string;
}

export interface TempFileDetail {
  name: string;
  path: string;
  size: number;
}

export interface TempCategory {
  category: string;
  count: number;
  size: number;
  files: TempFileDetail[];
}

export interface DownloadRecommendation {
  title: string;
  description: string;
  size: number;
  actionable_files: string[];
}

export interface DownloadsAnalysis {
  path: string;
  files: FileItem[];
  total_size: number;
  recommendations: DownloadRecommendation[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  size: number;
  recommendation: string;
}

export interface RecommendationResponse {
  total_recoverable: number;
  recommendations: RecommendationItem[];
}

export interface CleanupLog {
  id: number;
  timestamp: string;
  action_type: string;
  path: string;
  reclaimed_size: number;
  status: string;
  error_message: string | null;
}

export interface ScanHistory {
  id: number;
  drive: string;
  scanned_at: string;
  total_files: number;
  total_size: number;
  junk_size: number;
  duplicates_size: number;
}

export interface ScanProgress {
  is_scanning: boolean;
  drive: string;
  current_folder: string;
  files_scanned: number;
  bytes_scanned: number;
  percentage: number;
  est_remaining_seconds: number;
  categories_breakdown?: Record<string, number>;
}

export interface Settings {
  theme: string;
  include_hidden: boolean;
  include_system: boolean;
  follow_symlinks: boolean;
  safe_mode: boolean;
  thread_count: number;
  cache_size_mb: number;
}
