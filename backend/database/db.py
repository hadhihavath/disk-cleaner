import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "cleaner.db"))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Scan History Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drive TEXT NOT NULL,
            scanned_at TEXT NOT NULL,
            total_files INTEGER NOT NULL,
            total_size INTEGER NOT NULL,
            junk_size INTEGER NOT NULL,
            duplicates_size INTEGER NOT NULL
        )
    """)
    
    # Cleanup Logs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cleanup_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            action_type TEXT NOT NULL,
            path TEXT NOT NULL,
            reclaimed_size INTEGER NOT NULL,
            status TEXT NOT NULL,
            error_message TEXT
        )
    """)
    
    # Settings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    
    # Insert default settings if they don't exist
    default_settings = [
        ("theme", "dark"),
        ("include_hidden", "false"),
        ("include_system", "false"),
        ("follow_symlinks", "false"),
        ("safe_mode", "true"),
        ("thread_count", "4"),
        ("cache_size_mb", "512")
    ]
    for key, val in default_settings:
        cursor.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (key, val))
        
    conn.commit()
    conn.close()

def log_cleanup(action_type: str, path: str, reclaimed_size: int, status: str, error_message: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO cleanup_logs (timestamp, action_type, path, reclaimed_size, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (datetime.now().isoformat(), action_type, path, reclaimed_size, status, error_message))
    conn.commit()
    conn.close()

def save_scan_history(drive: str, total_files: int, total_size: int, junk_size: int, duplicates_size: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scan_history (drive, scanned_at, total_files, total_size, junk_size, duplicates_size)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (drive, datetime.now().isoformat(), total_files, total_size, junk_size, duplicates_size))
    conn.commit()
    conn.close()

def get_scan_history(limit: int = 10):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scan_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_cleanup_logs(limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cleanup_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM settings")
    rows = cursor.fetchall()
    conn.close()
    # Parse basic types
    settings_dict = {}
    for r in rows:
        key, value = r["key"], r["value"]
        if value.lower() == "true":
            settings_dict[key] = True
        elif value.lower() == "false":
            settings_dict[key] = False
        elif value.isdigit():
            settings_dict[key] = int(value)
        else:
            settings_dict[key] = value
    return settings_dict

def update_setting(key: str, value: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, str(value)))
    conn.commit()
    conn.close()

# Initialize on import
init_db()
