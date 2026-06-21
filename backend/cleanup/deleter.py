import os
import shutil
import ctypes
from database.db import log_cleanup, get_settings

# Critical paths that should never be deleted
SYSTEM_EXCLUDED_PATHS = {
    r"C:\Windows",
    r"C:\Program Files",
    r"C:\Program Files (x86)",
    r"C:\ProgramData",
    r"C:\Users\Public",
    # Root level files
    r"C:\pagefile.sys",
    r"C:\swapfile.sys",
    r"C:\hiberfil.sys",
    r"C:\bootmgr",
    r"C:\BOOTNXT"
}

def is_path_safe(path: str, safe_mode: bool = True) -> bool:
    """Validate if a path is safe to delete."""
    if not path:
        return False
        
    normalized_path = os.path.normpath(os.path.abspath(path))
    
    # Check exact system folder exclusions
    for system_path in SYSTEM_EXCLUDED_PATHS:
        if normalized_path.lower() == system_path.lower():
            return False
            
    # Check if the path lies within a critical system folder if safe mode is enabled
    if safe_mode:
        critical_prefixes = [
            r"C:\Windows",
            r"C:\Program Files",
            r"C:\Program Files (x86)",
            r"C:\ProgramData"
        ]
        for prefix in critical_prefixes:
            if normalized_path.lower().startswith(prefix.lower()):
                # Exception: User Temp inside AppData and Local\Temp is allowed
                if "appdata\\local\\temp" in normalized_path.lower():
                    continue
                return False
                
        # Also restrict deleting whole user profiles
        parts = normalized_path.split(os.sep)
        if len(parts) <= 3 and parts[0].lower() == "c:" and parts[1].lower() == "users":
            return False
            
    return True

def delete_file_or_folder(path: str) -> dict:
    """Delete a single file or folder safely and log the result."""
    settings = get_settings()
    safe_mode = settings.get("safe_mode", True)
    
    if not os.path.exists(path):
        return {"path": path, "status": "FAILED", "error": "Path does not exist", "bytes_reclaimed": 0}
        
    if not is_path_safe(path, safe_mode):
        error_msg = "Safety exclusion triggered. Deletion of system file or directory is blocked in Safe Mode."
        log_cleanup("delete", path, 0, "FAILED", error_msg)
        return {"path": path, "status": "FAILED", "error": error_msg, "bytes_reclaimed": 0}
        
    try:
        # Calculate size before deletion
        reclaimed_bytes = 0
        if os.path.isdir(path):
            # Calculate folder size
            for root, _, files in os.walk(path):
                for f in files:
                    try:
                        reclaimed_bytes += os.path.getsize(os.path.join(root, f))
                    except Exception:
                        pass
            shutil.rmtree(path)
        else:
            reclaimed_bytes = os.path.getsize(path)
            os.remove(path)
            
        log_cleanup("delete", path, reclaimed_bytes, "SUCCESS")
        return {"path": path, "status": "SUCCESS", "error": None, "bytes_reclaimed": reclaimed_bytes}
        
    except Exception as e:
        error_msg = str(e)
        log_cleanup("delete", path, 0, "FAILED", error_msg)
        return {"path": path, "status": "FAILED", "error": error_msg, "bytes_reclaimed": 0}

def empty_recycle_bin() -> dict:
    """Empty Windows Recycle Bin using native Win32 API."""
    try:
        # Flags:
        # SHERB_NOCONFIRMATION = 0x00000001 (No dialog confirming deletion)
        # SHERB_NOPROGRESSUI = 0x00000002 (No progress tracking dialog)
        # SHERB_NOSOUND = 0x00000004 (No delete sound effects)
        # Combine: 1 | 2 | 4 = 7
        flags = 7
        result = ctypes.windll.shell32.SHEmptyRecycleBinW(None, None, flags)
        
        if result == 0 or result == 0x80004005: # S_OK or Access Denied but completed/empty
            log_cleanup("empty_recycle_bin", "Recycle Bin", 0, "SUCCESS")
            return {"status": "SUCCESS", "error": None}
        else:
            # S_FALSE (already empty) or other codes
            return {"status": "SUCCESS", "error": "Recycle Bin might be already empty or completed."}
    except Exception as e:
        error_msg = str(e)
        log_cleanup("empty_recycle_bin", "Recycle Bin", 0, "FAILED", error_msg)
        return {"status": "FAILED", "error": error_msg}
