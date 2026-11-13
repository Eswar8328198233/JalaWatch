#!/usr/bin/env python3
"""
Pre-Upgrade Backup Script
Creates timestamped backups of SQLite database, Neon PostgreSQL data, and uploads folder.
"""
import os
import sys
import shutil
import datetime
import json
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
from database import get_db, get_engine_name, DB_PATH

BACKUPS_DIR = os.path.join(BASE_DIR, "backups")
os.makedirs(BACKUPS_DIR, exist_ok=True)
timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")

print(f"[Backup] Starting pre-upgrade backup with timestamp: {timestamp}")

# 1. Backup SQLite .db file
if os.path.exists(DB_PATH):
    sqlite_backup_path = os.path.join(BACKUPS_DIR, f"jalawatch_pre_upgrade_{timestamp}.db")
    shutil.copy2(DB_PATH, sqlite_backup_path)
    print(f"[Backup] Preserved SQLite database at: {sqlite_backup_path}")

# 2. Backup Active DB (Neon PostgreSQL / SQLite) as JSON snapshot
json_backup_path = os.path.join(BACKUPS_DIR, f"neon_pre_upgrade_{timestamp}.json")
with get_db() as conn:
    c = conn.cursor()
    c.execute("SELECT * FROM reports ORDER BY created_at ASC")
    reports = [dict(r) for r in c.fetchall()]
    c.execute("SELECT * FROM admins")
    admins = [dict(a) for a in c.fetchall()]
    c.execute("SELECT * FROM admin_activity_logs ORDER BY timestamp ASC")
    logs = [dict(l) for l in c.fetchall()]

backup_data = {
    "timestamp": timestamp,
    "engine": get_engine_name(),
    "reports_count": len(reports),
    "admins_count": len(admins),
    "logs_count": len(logs),
    "reports": reports,
    "admins": admins,
    "logs": logs
}

with open(json_backup_path, "w", encoding="utf-8") as f:
    json.dump(backup_data, f, indent=2, default=str)
print(f"[Backup] Saved active database ({get_engine_name()}) snapshot ({len(reports)} reports, {len(admins)} admins, {len(logs)} logs) to: {json_backup_path}")

# 3. Backup uploads folder
uploads_dir = os.path.join(BASE_DIR, "uploads")
if os.path.exists(uploads_dir):
    uploads_backup_dir = os.path.join(BACKUPS_DIR, f"uploads_pre_upgrade_{timestamp}")
    shutil.copytree(uploads_dir, uploads_backup_dir)
    print(f"[Backup] Preserved uploads directory at: {uploads_backup_dir}")

print("[Backup] Pre-upgrade backup completed successfully.")
