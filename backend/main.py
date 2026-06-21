import os
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import psutil

# Import local backend modules
from database.db import (
    get_settings, update_setting, get_cleanup_logs, 
    get_scan_history, log_cleanup
)
from analyzers.scanner import (
    global_scan_state, start_scan, stop_scan, 
    get_temp_files, analyze_downloads_folder
)
from analyzers.registry import get_installed_software
from cleanup.deleter import delete_file_or_folder, empty_recycle_bin
from reports.generator import generate_csv_report, generate_html_report

app = FastAPI(title="Drive Cleaner Pro API")

# Allow localhost CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it runs locally, * is safe and avoids Dev proxy issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    drive: str

class DeleteRequest(BaseModel):
    paths: List[str]

class CleanupTempRequest(BaseModel):
    categories: List[str]

class SettingUpdateRequest(BaseModel):
    key: str
    value: str

@app.get("/api/drives")
def get_drives():
    drives = []
    for p in psutil.disk_partitions(all=False):
        if 'cdrom' in p.opts or p.fstype == '':
            continue
        try:
            usage = psutil.disk_usage(p.mountpoint)
            drives.append({
                "device": p.device,
                "mountpoint": p.mountpoint,
                "fstype": p.fstype,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "percent": usage.percent
            })
        except Exception:
            pass
    return drives

@app.get("/api/drive-info/{drive}")
def get_drive_info(drive: str):
    mount = f"{drive.upper()}:\\" if not drive.endswith("\\") else drive.upper()
    try:
        usage = psutil.disk_usage(mount)
        return {
            "drive": drive,
            "total": usage.total,
            "used": usage.used,
            "free": usage.free,
            "percent": usage.percent
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read drive {drive}: {str(e)}")

@app.post("/api/scan")
def post_scan(req: ScanRequest):
    drive = req.drive
    # Append trailing slash if missing for windows pathing
    if not drive.endswith("\\") and ":" in drive:
        drive = f"{drive}\\"
        
    if not os.path.exists(drive):
        raise HTTPException(status_code=400, detail=f"Drive {drive} does not exist.")
        
    success = start_scan(drive)
    if not success:
        return {"status": "error", "message": "Scan already in progress"}
    return {"status": "started", "drive": drive}

@app.post("/api/stop-scan")
def post_stop_scan():
    stopped = stop_scan()
    if stopped:
        return {"status": "stopped"}
    return {"status": "error", "message": "No scan running"}

@app.get("/api/scan-progress")
def get_scan_progress():
    with global_scan_state.lock:
        return {
            "is_scanning": global_scan_state.is_scanning,
            "drive": global_scan_state.drive,
            "current_folder": global_scan_state.current_folder,
            "files_scanned": global_scan_state.files_scanned,
            "bytes_scanned": global_scan_state.bytes_scanned,
            "percentage": global_scan_state.percentage,
            "est_remaining_seconds": global_scan_state.est_remaining_seconds
        }

@app.get("/api/large-files")
def get_large_files():
    with global_scan_state.lock:
        return global_scan_state.large_files

@app.get("/api/large-folders")
def get_large_folders():
    with global_scan_state.lock:
        return global_scan_state.large_folders

@app.get("/api/duplicates")
def get_duplicates():
    with global_scan_state.lock:
        # Format for Duplicates page
        result = []
        for d in global_scan_state.duplicates:
            # files includes original + matches
            orig = d["files"][0]
            dups = d["files"][1:]
            result.append({
                "hash": d["hash"],
                "size": d["size"],
                "original": orig,
                "duplicates": dups
            })
        return result

@app.get("/api/software")
def get_software():
    try:
        return get_installed_software()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read registry: {str(e)}")

@app.get("/api/temp-files")
def get_temp_files_endpoint():
    try:
        return get_temp_files()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan temp files: {str(e)}")

@app.get("/api/downloads-analysis")
def get_downloads_analysis():
    try:
        return analyze_downloads_folder()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze Downloads: {str(e)}")

@app.get("/api/recommendations")
def get_recommendations():
    recs = []
    total_estimated = 0
    
    # 1. Temp files check
    try:
        temps = get_temp_files()
        temp_size = sum(t["size"] for t in temps.values())
        if temp_size > 0:
            recs.append({
                "id": "temp_files",
                "title": "Clear Temporary Files",
                "description": "Delete Windows temporary cache, user logs, and browser storage caches safely.",
                "size": temp_size,
                "recommendation": f"Delete temporary files ({format_size(temp_size)})"
            })
            total_estimated += temp_size
    except Exception:
        pass
        
    # 2. Duplicates check
    with global_scan_state.lock:
        duplicates = global_scan_state.duplicates
    dup_size = 0
    for d in duplicates:
        # Size recovered is (count - 1) * file_size
        dup_size += (len(d["files"]) - 1) * d["size"]
        
    if dup_size > 0:
        recs.append({
            "id": "duplicates",
            "title": "Remove Duplicate Files",
            "description": f"Found duplicate files with identical contents on your drive.",
            "size": dup_size,
            "recommendation": f"Remove duplicates ({format_size(dup_size)})"
        })
        total_estimated += dup_size
        
    # 3. Downloads check
    try:
        dl_analysis = analyze_downloads_folder()
        for r in dl_analysis.get("recommendations", []):
            recs.append({
                "id": "downloads_" + r["title"].lower().replace(" ", "_"),
                "title": r["title"],
                "description": r["description"],
                "size": r["size"],
                "recommendation": f"{r['title']} ({format_size(r['size'])})"
            })
            total_estimated += r["size"]
    except Exception:
        pass
        
    # 4. Old files check (if not in duplicates or downloads already)
    with global_scan_state.lock:
        old_files = global_scan_state.old_files
    old_size = sum(f["size"] for f in old_files[:100]) # Estimate based on top 100
    if old_size > 0:
        recs.append({
            "id": "old_files",
            "title": "Clean Old Unaccessed Files",
            "description": "Files that haven't been accessed for more than 6 months.",
            "size": old_size,
            "recommendation": f"Remove old unaccessed files ({format_size(old_size)})"
        })
        total_estimated += old_size
        
    return {
        "total_recoverable": total_estimated,
        "recommendations": recs
    }

@app.post("/api/delete-files")
def post_delete_files(req: DeleteRequest):
    results = []
    for path in req.paths:
        res = delete_file_or_folder(path)
        results.append(res)
    return results

@app.post("/api/cleanup-temp")
def post_cleanup_temp(req: CleanupTempRequest):
    temps = get_temp_files()
    results = []
    
    for category in req.categories:
        if category in temps:
            cat_data = temps[category]
            # Delete files in this category
            for f in cat_data.get("files", []):
                res = delete_file_or_folder(f["path"])
                results.append(res)
                
    success_bytes = sum(r["bytes_reclaimed"] for r in results if r["status"] == "SUCCESS")
    return {"status": "completed", "bytes_reclaimed": success_bytes, "details": results}

@app.post("/api/empty-recycle-bin")
def post_empty_recycle_bin():
    return empty_recycle_bin()

@app.get("/api/logs")
def get_logs(limit: int = 50):
    return get_cleanup_logs(limit)

@app.get("/api/scan-history")
def get_history(limit: int = 10):
    return get_scan_history(limit)

@app.get("/api/settings")
def get_settings_endpoint():
    return get_settings()

@app.post("/api/settings")
def post_update_setting(req: SettingUpdateRequest):
    update_setting(req.key, req.value)
    return {"status": "updated", "key": req.key, "value": req.value}

@app.post("/api/export-report")
def post_export_report(format: str = Query("html", enum=["html", "csv"])):
    # Prepare data dictionary from scanner memory
    with global_scan_state.lock:
        data = {
            "drive": global_scan_state.drive,
            "files_scanned": global_scan_state.files_scanned,
            "bytes_scanned": global_scan_state.bytes_scanned,
            "large_files": global_scan_state.large_files,
            "large_folders": global_scan_state.large_folders,
            "duplicates": global_scan_state.duplicates
        }
        
    os.makedirs("reports", exist_ok=True)
    timestamp = datetime_str()
    
    if format == "csv":
        filepath = os.path.abspath(f"reports/report_{timestamp}.csv")
        success = generate_csv_report(data, filepath)
    else:
        filepath = os.path.abspath(f"reports/report_{timestamp}.html")
        success = generate_html_report(data, filepath)
        
    if not success:
        raise HTTPException(status_code=500, detail="Failed to write report file")
        
    return {"status": "exported", "filepath": filepath}

@app.get("/api/reports")
def get_reports_list():
    reports_dir = "reports"
    if not os.path.exists(reports_dir):
        return []
    try:
        files = []
        for f in os.listdir(reports_dir):
            path = os.path.join(reports_dir, f)
            if os.path.isfile(path) and f.startswith("report_"):
                stat = os.stat(path)
                files.append({
                    "name": f,
                    "path": os.path.abspath(path),
                    "size": stat.st_size,
                    "created_at": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_ctime))
                })
        return sorted(files, key=lambda x: x["created_at"], reverse=True)
    except Exception:
        return []

@app.websocket("/ws/scan-progress")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            with global_scan_state.lock:
                # Include standard metrics
                progress_data = {
                    "is_scanning": global_scan_state.is_scanning,
                    "drive": global_scan_state.drive,
                    "current_folder": global_scan_state.current_folder,
                    "files_scanned": global_scan_state.files_scanned,
                    "bytes_scanned": global_scan_state.bytes_scanned,
                    "percentage": global_scan_state.percentage,
                    "est_remaining_seconds": global_scan_state.est_remaining_seconds,
                    "categories_breakdown": global_scan_state.categories_breakdown
                }
            await websocket.send_json(progress_data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass

def format_size(bytes_sz: int) -> str:
    for unit in ['Bytes', 'KB', 'MB', 'GB', 'TB']:
        if bytes_sz < 1024.0:
            return f"{bytes_sz:.2f} {unit}"
        bytes_sz /= 1024.0
    return f"{bytes_sz:.2f} PB"

def datetime_str() -> str:
    from datetime import datetime
    return datetime.now().strftime("%Y%m%d_%H%M%S")
