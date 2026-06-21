import os
import time
import hashlib
import threading
from collections import defaultdict
from pathlib import Path
import psutil
from database.db import get_settings

# File type definitions
EXTENSION_MAP = {
    # Videos
    'mp4': 'Videos', 'mkv': 'Videos', 'avi': 'Videos', 'mov': 'Videos', 
    'wmv': 'Videos', 'flv': 'Videos', 'webm': 'Videos',
    # Images
    'jpg': 'Images', 'jpeg': 'Images', 'png': 'Images', 'gif': 'Images', 
    'bmp': 'Images', 'svg': 'Images', 'webp': 'Images', 'ico': 'Images', 'tiff': 'Images',
    # Documents
    'pdf': 'Documents', 'doc': 'Documents', 'docx': 'Documents', 'xls': 'Documents', 
    'xlsx': 'Documents', 'ppt': 'Documents', 'pptx': 'Documents', 'txt': 'Documents', 
    'rtf': 'Documents', 'csv': 'Documents', 'md': 'Documents',
    # Archives
    'zip': 'Archives', 'rar': 'Archives', '7z': 'Archives', 'tar': 'Archives', 
    'gz': 'Archives', 'bz2': 'Archives',
    # Software
    'exe': 'Software', 'msi': 'Software', 'bat': 'Software', 'cmd': 'Software', 
    'com': 'Software',
    # System Files
    'sys': 'System Files', 'dll': 'System Files', 'cab': 'System Files', 
    'ini': 'System Files', 'inf': 'System Files', 'lnk': 'System Files'
}

# Critical directories to skip by default for speed & safety
DEFAULT_EXCLUDED_DIRS = {
    'Windows', 'Program Files', 'Program Files (x86)', 'System Volume Information',
    '$Recycle.Bin', '$WINDOWS.~BT', '$Windows.~WS', 'WindowsApps', 'AppData'
}

class ScanState:
    def __init__(self):
        self.lock = threading.Lock()
        self.is_scanning = False
        self.drive = ""
        self.current_folder = ""
        self.files_scanned = 0
        self.bytes_scanned = 0
        self.start_time = 0.0
        self.percentage = 0.0
        self.est_remaining_seconds = 0
        self.large_files = []
        self.large_folders = []
        self.duplicates = []
        self.categories_breakdown = {cat: 0 for cat in set(EXTENSION_MAP.values())}
        self.categories_breakdown['Other'] = 0
        self.old_files = []
        self.temp_files_summary = {}
        self.downloads_summary = {}

# Global scan state
global_scan_state = ScanState()

def get_quick_hash(filepath: str) -> str:
    """Hash only the first 4KB of the file for quick identification of non-duplicates."""
    try:
        with open(filepath, 'rb') as f:
            chunk = f.read(4096)
            return hashlib.md5(chunk).hexdigest()
    except Exception:
        return ""

def get_full_hash(filepath: str) -> str:
    """Compute complete SHA256 of a file."""
    h = hashlib.sha256()
    try:
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return ""

def run_scan_thread(drive_letter: str, settings: dict):
    global global_scan_state
    
    with global_scan_state.lock:
        global_scan_state.is_scanning = True
        global_scan_state.drive = drive_letter
        global_scan_state.current_folder = drive_letter
        global_scan_state.files_scanned = 0
        global_scan_state.bytes_scanned = 0
        global_scan_state.start_time = time.time()
        global_scan_state.percentage = 0.0
        global_scan_state.est_remaining_seconds = 0
        global_scan_state.large_files = []
        global_scan_state.large_folders = []
        global_scan_state.duplicates = []
        global_scan_state.categories_breakdown = {cat: 0 for cat in set(EXTENSION_MAP.values())}
        global_scan_state.categories_breakdown['Other'] = 0
        global_scan_state.old_files = []
        
    try:
        # Get drive disk usage info for progress bar estimation
        usage = psutil.disk_usage(drive_letter)
        total_used_bytes = usage.used if usage.used > 0 else 1
        
        # Temp list for processing items
        all_files = []
        folder_sizes = defaultdict(int)
        
        # Options from settings
        include_hidden = settings.get("include_hidden", False)
        include_system = settings.get("include_system", False)
        follow_symlinks = settings.get("follow_symlinks", False)
        
        # Fast path walking
        for root, dirs, files in os.walk(drive_letter, followlinks=follow_symlinks):
            # Check if scan was cancelled or completed
            if not global_scan_state.is_scanning:
                return
                
            # Filter directories based on exclusions (Safe Mode)
            # If include_system is False, exclude Windows/Program Files directories
            if not include_system:
                dirs[:] = [d for d in dirs if d not in DEFAULT_EXCLUDED_DIRS]
                
            # Skip hidden folders if set
            if not include_hidden:
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                
            # Update current folder in state periodically to prevent locking overhead
            if global_scan_state.files_scanned % 100 == 0:
                with global_scan_state.lock:
                    global_scan_state.current_folder = root
                    
            for file in files:
                filepath = os.path.join(root, file)
                
                # Check cancellation
                if not global_scan_state.is_scanning:
                    return
                
                # Skip hidden files
                if not include_hidden and file.startswith('.'):
                    continue
                    
                try:
                    # Get size and times
                    stat = os.stat(filepath)
                    size = stat.st_size
                    atime = stat.st_atime
                    mtime = stat.st_mtime
                    
                    # Accumulate progress stats
                    with global_scan_state.lock:
                        global_scan_state.files_scanned += 1
                        global_scan_state.bytes_scanned += size
                        
                        # Categories breakdown
                        ext = file.split('.')[-1].lower() if '.' in file else ''
                        category = EXTENSION_MAP.get(ext, 'Other')
                        global_scan_state.categories_breakdown[category] += size
                        
                        # Recalculate percent and estimated time
                        global_scan_state.percentage = min(99.9, (global_scan_state.bytes_scanned / total_used_bytes) * 100)
                        
                        elapsed = time.time() - global_scan_state.start_time
                        if global_scan_state.bytes_scanned > 0 and elapsed > 1:
                            bytes_per_sec = global_scan_state.bytes_scanned / elapsed
                            remaining_bytes = total_used_bytes - global_scan_state.bytes_scanned
                            if remaining_bytes > 0:
                                global_scan_state.est_remaining_seconds = int(remaining_bytes / bytes_per_sec)
                                
                    # Record folder size accumulation
                    folder_path = root
                    folder_sizes[folder_path] += size
                    
                    # Add to memory cache for sorting
                    all_files.append({
                        "name": file,
                        "path": filepath,
                        "ext": ext,
                        "size": size,
                        "mtime": mtime,
                        "atime": atime
                    })
                    
                except Exception:
                    # Permission denied or deleted file during scan
                    pass
                    
        # Post-scan analysis
        if not global_scan_state.is_scanning:
            return
            
        with global_scan_state.lock:
            global_scan_state.current_folder = "Analyzing large items..."
            
        # 1. Large files (top 500)
        large_files_sorted = sorted(all_files, key=lambda x: x['size'], reverse=True)[:500]
        
        # 2. Large folders (top 100)
        large_folders_sorted = []
        for folder_path, folder_sz in folder_sizes.items():
            if folder_sz > 10 * 1024 * 1024: # Larger than 10MB
                path_obj = Path(folder_path)
                large_folders_sorted.append({
                    "name": path_obj.name or str(path_obj),
                    "path": folder_path,
                    "size": folder_sz,
                    "percentage": (folder_sz / usage.total) * 100 if usage.total > 0 else 0
                })
        large_folders_sorted = sorted(large_folders_sorted, key=lambda x: x['size'], reverse=True)[:100]
        
        # 3. Old files (not accessed in 6 months)
        now = time.time()
        six_months_sec = 6 * 30 * 24 * 60 * 60
        old_files_list = []
        for f in all_files:
            if now - f['atime'] > six_months_sec:
                old_files_list.append({
                    "name": f['name'],
                    "path": f['path'],
                    "size": f['size'],
                    "last_access": datetime_from_timestamp(f['atime'])
                })
        old_files_sorted = sorted(old_files_list, key=lambda x: x['size'], reverse=True)[:500]
        
        # 4. Duplicate finder (optimized grouping by size first)
        with global_scan_state.lock:
            global_scan_state.current_folder = "Analyzing duplicate files..."
            
        size_groups = defaultdict(list)
        for f in all_files:
            if f['size'] > 1024 * 1024: # Only scan duplicates > 1MB to make it fast & useful
                size_groups[f['size']].append(f)
                
        # Filter size groups with multiple files
        dup_candidates = {sz: files for sz, files in size_groups.items() if len(files) > 1}
        
        # Quick hash grouping
        quick_hash_groups = defaultdict(list)
        for sz, files in dup_candidates.items():
            for f in files:
                if not global_scan_state.is_scanning:
                    return
                qh = get_quick_hash(f['path'])
                if qh:
                    quick_hash_groups[(sz, qh)].append(f)
                    
        # Filter quick hash groups with multiple files
        qh_candidates = {key: files for key, files in quick_hash_groups.items() if len(files) > 1}
        
        # Full hash grouping for final matches
        final_duplicates = []
        for (sz, qh), files in qh_candidates.items():
            full_hash_groups = defaultdict(list)
            for f in files:
                if not global_scan_state.is_scanning:
                    return
                fh = get_full_hash(f['path'])
                if fh:
                    full_hash_groups[fh].append(f)
            
            # Record duplicate groups
            for fh, matched_files in full_hash_groups.items():
                if len(matched_files) > 1:
                    # Sort files in group so oldest or first is labeled "original"
                    matched_files_sorted = sorted(matched_files, key=lambda x: x['mtime'])
                    final_duplicates.append({
                        "hash": fh,
                        "size": sz,
                        "files": matched_files_sorted
                    })
                    
        # Update progress and save metrics
        with global_scan_state.lock:
            global_scan_state.large_files = large_files_sorted
            global_scan_state.large_folders = large_folders_sorted
            global_scan_state.duplicates = final_duplicates
            global_scan_state.old_files = old_files_sorted
            global_scan_state.percentage = 100.0
            global_scan_state.est_remaining_seconds = 0
            global_scan_state.current_folder = "Scan complete"
            
        # Log to DB
        from database.db import save_scan_history
        junk_size = 0  # We will calculate junk size below or leave as estimated
        dup_recoverable = sum((len(d['files']) - 1) * d['size'] for d in final_duplicates)
        save_scan_history(drive_letter, len(all_files), global_scan_state.bytes_scanned, 0, dup_recoverable)
        
    except Exception as e:
        with global_scan_state.lock:
            global_scan_state.current_folder = f"Error during scan: {str(e)}"
    finally:
        with global_scan_state.lock:
            global_scan_state.is_scanning = False

def datetime_from_timestamp(ts: float) -> str:
    try:
        return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))
    except Exception:
        return "Unknown"

def start_scan(drive_letter: str):
    global global_scan_state
    
    settings = get_settings()
    
    with global_scan_state.lock:
        if global_scan_state.is_scanning:
            return False # Scan already in progress
            
    thread = threading.Thread(target=run_scan_thread, args=(drive_letter, settings), daemon=True)
    thread.start()
    return True

def stop_scan():
    global global_scan_state
    with global_scan_state.lock:
        if global_scan_state.is_scanning:
            global_scan_state.is_scanning = False
            global_scan_state.current_folder = "Scan cancelled by user"
            return True
    return False

def get_temp_files():
    """Detect and summarize temporary files."""
    categories = {
        "Windows Temp": [r"C:\Windows\Temp"],
        "User Temp": [os.environ.get("TEMP", "")],
        "Browser Cache": [
            os.path.expandvars(r"%LocalAppData%\Google\Chrome\User Data\Default\Cache\Cache_Data"),
            os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\User Data\Default\Cache\Cache_Data")
        ],
        "Thumbnail Cache": [
            os.path.expandvars(r"%LocalAppData%\Microsoft\Windows\Explorer") # thumbcache_*.db
        ],
        "Windows Update Cache": [r"C:\Windows\SoftwareDistribution\Download"],
        "Log Files": [r"C:\Windows\Logs"],
        "Crash Dumps": [
            os.path.expandvars(r"%LocalAppData%\CrashDumps"),
            r"C:\Windows\Minidump"
        ]
    }
    
    summary = {}
    for cat_name, paths in categories.items():
        total_size = 0
        file_count = 0
        detail_files = []
        
        for path in paths:
            if not path or not os.path.exists(path):
                continue
            
            try:
                # If path is file, calculate it
                if os.path.isfile(path):
                    sz = os.path.getsize(path)
                    total_size += sz
                    file_count += 1
                    detail_files.append({"name": os.path.basename(path), "path": path, "size": sz})
                else:
                    # Is directory, traverse it
                    for root, _, files in os.walk(path):
                        for f in files:
                            # If category is thumbnail cache, only match thumbcache files
                            if cat_name == "Thumbnail Cache" and not f.startswith("thumbcache_"):
                                continue
                            f_path = os.path.join(root, f)
                            try:
                                sz = os.path.getsize(f_path)
                                total_size += sz
                                file_count += 1
                                # Limit items to first 200 for preview
                                if len(detail_files) < 200:
                                    detail_files.append({"name": f, "path": f_path, "size": sz})
                            except Exception:
                                pass
            except Exception:
                pass
                
        summary[cat_name] = {
            "category": cat_name,
            "count": file_count,
            "size": total_size,
            "files": detail_files
        }
        
    return summary

def analyze_downloads_folder():
    """Analyze downloads directory."""
    downloads_path = str(Path.home() / "Downloads")
    if not os.path.exists(downloads_path):
        return {"path": downloads_path, "files": [], "total_size": 0, "recommendations": []}
        
    files_list = []
    total_size = 0
    now = time.time()
    
    try:
        for entry in os.scandir(downloads_path):
            if entry.is_file():
                try:
                    stat = entry.stat()
                    size = stat.st_size
                    total_size += size
                    
                    files_list.append({
                        "name": entry.name,
                        "path": entry.path,
                        "size": size,
                        "atime": stat.st_atime,
                        "mtime": stat.st_mtime
                    })
                except Exception:
                    pass
    except Exception:
        pass
        
    # Recommendations
    recommendations = []
    
    # 1. Unused / Old downloads (not accessed in 6 months)
    six_months = 180 * 24 * 60 * 60
    old_downloads = [f for f in files_list if now - f['atime'] > six_months]
    if old_downloads:
        old_sz = sum(f['size'] for f in old_downloads)
        recommendations.append({
            "title": "Remove Unused Downloads",
            "description": f"{len(old_downloads)} files have not been opened for over 6 months.",
            "size": old_sz,
            "actionable_files": [f['path'] for f in old_downloads]
        })
        
    # 2. Large zip/installers
    large_zips = [f for f in files_list if f['name'].lower().endswith(('.zip', '.rar', '.7z', '.exe', '.msi')) and f['size'] > 100 * 1024 * 1024]
    if large_zips:
        zip_sz = sum(f['size'] for f in large_zips)
        recommendations.append({
            "title": "Clean Large Archive & Installer Files",
            "description": f"Found {len(large_zips)} large archive/installer files (>100MB) taking up valuable space.",
            "size": zip_sz,
            "actionable_files": [f['path'] for f in large_zips]
        })
        
    return {
        "path": downloads_path,
        "files": sorted(files_list, key=lambda x: x['size'], reverse=True),
        "total_size": total_size,
        "recommendations": recommendations
    }
