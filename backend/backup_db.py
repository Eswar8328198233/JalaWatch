#!/usr/bin/env python3
"""
JalaWatch Database Backup Utility
Exports all reports and admin records to timestamped JSON backup files.
"""

import os
import json
import datetime
from database import get_db, get_engine_name

BACKUP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")

def create_backup():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"jalawatch_backup_{timestamp}.json")

    with get_db() as conn:
        cursor = conn.cursor()

        # Fetch all reports
        cursor.execute("SELECT * FROM reports ORDER BY created_at ASC")
        reports = [dict(row) for row in cursor.fetchall()]

        # Fetch admin accounts (without sensitive password hashes in general log, but preserved for restore)
        cursor.execute("SELECT id, username, email, role, created_at, last_login, password_hash FROM admins")
        admins = [dict(row) for row in cursor.fetchall()]

    backup_data = {
        "metadata": {
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "engine": get_engine_name(),
            "total_reports": len(reports),
            "total_admins": len(admins),
            "project": "JalaWatch Nutakki CSP"
        },
        "reports": reports,
        "admins": admins
    }

    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)

    print(f"[Backup] Successfully exported {len(reports)} reports and {len(admins)} admins to:")
    print(f"         {backup_file}")
    return backup_file

if __name__ == "__main__":
    create_backup()
