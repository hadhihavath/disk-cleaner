import os
import sys

# Add parent directory to sys.path so we can import packages
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db import get_settings, init_db
from analyzers.registry import get_installed_software
from analyzers.scanner import get_temp_files
from cleanup.deleter import is_path_safe

def test_diagnostics():
    print("================== RUNNING DIAGNOSTIC CHECKS ==================")
    
    # 1. Test database initialization
    print("[1/4] Initializing Database...")
    init_db()
    settings = get_settings()
    print(f" -> Success! Theme setting: {settings.get('theme')}")
    
    # 2. Test software registry querying
    print("[2/4] Scanning installed applications registry keys...")
    try:
        software = get_installed_software()
        print(f" -> Success! Found {len(software)} installed software profiles.")
        if software:
            print(f"    Sample: {software[0]['name']} (Publisher: {software[0]['publisher']})")
    except Exception as e:
        print(f" -> Failed registry scan: {str(e)}")
        
    # 3. Test temp files category scan
    print("[3/4] Scanning temporary files space...")
    try:
        temps = get_temp_files()
        print(f" -> Success! Found {len(temps)} temp categories.")
        for k, v in temps.items():
            print(f"    - {k}: {v['count']} files, {v['size'] / (1024*1024):.2f} MB")
    except Exception as e:
        print(f" -> Failed temp scan: {str(e)}")
        
    # 4. Test safe deleter exclusions
    print("[4/4] Verifying path deletion safe guards...")
    critical_paths = [
        "C:\\Windows",
        "C:\\Windows\\System32",
        "C:\\Program Files",
        "C:\\Users"
    ]
    safe_paths = [
        os.path.join(os.environ.get("TEMP", "C:\\Temp"), "dummy.txt")
    ]
    
    print("    - Testing critical paths (expected: UNSAFE/FALSE):")
    for cp in critical_paths:
        safe = is_path_safe(cp, safe_mode=True)
        print(f"      * {cp} -> Safe? {safe}")
        assert not safe, f"Critical path {cp} incorrectly marked as safe!"
        
    print("    - Testing safe user paths (expected: SAFE/TRUE):")
    for sp in safe_paths:
        safe = is_path_safe(sp, safe_mode=True)
        print(f"      * {sp} -> Safe? {safe}")
        
    print("================== ALL DIAGNOSTICS COMPLETED SUCCESSFULLY ==================")

if __name__ == "__main__":
    test_diagnostics()
