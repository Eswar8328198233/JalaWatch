#!/usr/bin/env python3
"""
JalaWatch PostgreSQL-to-SQLite Reverse Migration & Rollback Synchronization Tool
Exports all reports, admin accounts, and activity audit logs from managed PostgreSQL (Neon)
back into SQLite to preserve records and Cloudinary URLs during a production rollback.
"""

import os
import sys
import argparse
import datetime
import sqlite3
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

for env_path in [
    os.path.join(ROOT_DIR, ".env.local"),
    os.path.join(ROOT_DIR, ".env"),
    os.path.join(BASE_DIR, ".env"),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)

from database import connect_postgres, PSYCOPG2_AVAILABLE

if not PSYCOPG2_AVAILABLE:
    print("[Error] psycopg2 is not installed. Please install psycopg2-binary.")
    sys.exit(1)

import psycopg2.extras

DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "jalawatch.db")

def parse_args():
    parser = argparse.ArgumentParser(description="Synchronize JalaWatch data from PostgreSQL to SQLite (Rollback Engine)")
    parser.add_argument(
        "--source-url",
        dest="source_url",
        help="Source PostgreSQL connection string. If omitted, reads DATABASE_URL."
    )
    parser.add_argument(
        "--sqlite-path",
        dest="sqlite_path",
        default=DEFAULT_SQLITE_PATH,
        help="Target SQLite database file (default: backend/jalawatch.db)"
    )
    parser.add_argument(
        "--dry-run",
        dest="dry_run",
        action="store_true",
        help="Simulate reverse sync without modifying the SQLite file."
    )
    return parser.parse_args()

def sync():
    args = parse_args()
    source_url = (
        args.source_url
        or os.environ.get("DATABASE_URL")
        or os.environ.get("DATABASE_URL_UNPOOLED")
        or os.environ.get("SUPABASE_DB_URL")
    )

    if not source_url:
        print("[Error] No PostgreSQL connection URL provided.")
        sys.exit(1)

    print("==================================================")
    print("   JalaWatch Reverse Rollback Synchronization Tool")
    print("==================================================")
    masked_url = source_url.split("@")[-1] if "@" in source_url else "source_url"
    print(f"Source Postgres: ...@{masked_url}")
    print(f"Target SQLite:   {args.sqlite_path}")
    print(f"Mode:            {'DRY-RUN (Safe Verification)' if args.dry_run else 'LIVE REVERSE SYNC'}")
    print("==================================================")

    # 1. Connect to PostgreSQL
    try:
        pg_conn = connect_postgres(source_url)
        pg_cur = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as e:
        print(f"[Error] Could not connect to PostgreSQL: {e}")
        sys.exit(1)

    pg_cur.execute("SELECT * FROM reports ORDER BY created_at ASC;")
    pg_reports = pg_cur.fetchall()

    pg_cur.execute("SELECT * FROM admins ORDER BY id ASC;")
    pg_admins = pg_cur.fetchall()

    pg_cur.execute("SELECT * FROM admin_activity_logs ORDER BY id ASC;")
    pg_logs = pg_cur.fetchall()

    print(f"[PostgreSQL Source] Found:")
    print(f"  - Reports:       {len(pg_reports)}")
    print(f"  - Admins:        {len(pg_admins)}")
    print(f"  - Activity Logs: {len(pg_logs)}")
    print()

    # 2. Connect to SQLite
    sq_conn = sqlite3.connect(args.sqlite_path)
    sq_conn.row_factory = sqlite3.Row
    sq_cur = sq_conn.cursor()

    # Ensure schema exists in SQLite
    sq_cur.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at TEXT NOT NULL,
            last_login TEXT
        );
    """)

    sq_cur.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            village TEXT NOT NULL,
            category TEXT NOT NULL,
            water_source TEXT,
            date_observed TEXT NOT NULL,
            landmark TEXT,
            description TEXT NOT NULL,
            photo_url TEXT,
            latitude REAL,
            longitude REAL,
            reporter_name TEXT DEFAULT 'Anonymous Community Member',
            reporter_contact TEXT,
            status TEXT DEFAULT 'Submitted',
            is_verified INTEGER DEFAULT 0,
            admin_notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_demo INTEGER DEFAULT 0,
            ph REAL,
            tds REAL,
            fluoride REAL,
            nitrate REAL,
            e_coli TEXT,
            lab_name TEXT,
            testing_date TEXT,
            lab_certificate_url TEXT,
            lab_notes TEXT,
            lab_status TEXT DEFAULT 'Not Tested'
        );
    """)

    sq_cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id TEXT,
            username TEXT,
            action TEXT NOT NULL,
            report_id TEXT,
            previous_status TEXT,
            new_status TEXT,
            details TEXT,
            timestamp TEXT NOT NULL
        );
    """)

    # Sync Admins
    synced_admins = 0
    updated_admins = 0
    for a in pg_admins:
        sq_cur.execute("SELECT id, password_hash FROM admins WHERE username = ?", (a["username"],))
        row = sq_cur.fetchone()
        if not row:
            if not args.dry_run:
                sq_cur.execute("""
                    INSERT INTO admins (username, email, password_hash, role, created_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (a["username"], a["email"], a["password_hash"], a.get("role", "admin"), a["created_at"], a.get("last_login")))
            synced_admins += 1
        else:
            if row["password_hash"] != a["password_hash"]:
                if not args.dry_run:
                    sq_cur.execute("""
                        UPDATE admins SET email = ?, password_hash = ?, role = ?, last_login = ?
                        WHERE username = ?
                    """, (a["email"], a["password_hash"], a.get("role", "admin"), a.get("last_login"), a["username"]))
                updated_admins += 1

    # Sync Reports (Upsert: inserts new and updates modified)
    synced_reports = 0
    updated_reports = 0
    for r in pg_reports:
        sq_cur.execute("SELECT id FROM reports WHERE id = ?", (r["id"],))
        if not sq_cur.fetchone():
            if not args.dry_run:
                sq_cur.execute("""
                    INSERT INTO reports (
                        id, village, category, water_source, date_observed, landmark,
                        description, photo_url, latitude, longitude, reporter_name,
                        reporter_contact, status, is_verified, admin_notes,
                        created_at, updated_at, is_demo,
                        ph, tds, fluoride, nitrate, e_coli, lab_name, testing_date,
                        lab_certificate_url, lab_notes, lab_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    r["id"], r["village"], r["category"], r["water_source"], r["date_observed"],
                    r["landmark"], r["description"], r["photo_url"], r["latitude"], r["longitude"],
                    r["reporter_name"], r["reporter_contact"], r["status"], r["is_verified"],
                    r["admin_notes"], r["created_at"], r["updated_at"], r["is_demo"],
                    r.get("ph"), r.get("tds"), r.get("fluoride"), r.get("nitrate"), r.get("e_coli"),
                    r.get("lab_name"), r.get("testing_date"), r.get("lab_certificate_url"),
                    r.get("lab_notes"), r.get("lab_status", "Not Tested")
                ))
            synced_reports += 1
        else:
            # Update existing to capture any admin notes or status updates made in Neon
            if not args.dry_run:
                sq_cur.execute("""
                    UPDATE reports SET
                        village = ?, category = ?, water_source = ?, date_observed = ?, landmark = ?,
                        description = ?, photo_url = ?, latitude = ?, longitude = ?, reporter_name = ?,
                        reporter_contact = ?, status = ?, is_verified = ?, admin_notes = ?,
                        updated_at = ?, is_demo = ?,
                        ph = ?, tds = ?, fluoride = ?, nitrate = ?, e_coli = ?, lab_name = ?, testing_date = ?,
                        lab_certificate_url = ?, lab_notes = ?, lab_status = ?
                    WHERE id = ?
                """, (
                    r["village"], r["category"], r["water_source"], r["date_observed"], r["landmark"],
                    r["description"], r["photo_url"], r["latitude"], r["longitude"], r["reporter_name"],
                    r["reporter_contact"], r["status"], r["is_verified"], r["admin_notes"],
                    r["updated_at"], r["is_demo"],
                    r.get("ph"), r.get("tds"), r.get("fluoride"), r.get("nitrate"), r.get("e_coli"),
                    r.get("lab_name"), r.get("testing_date"), r.get("lab_certificate_url"),
                    r.get("lab_notes"), r.get("lab_status", "Not Tested"),
                    r["id"]
                ))
            updated_reports += 1

    # Sync Activity Logs
    synced_logs = 0
    for l in pg_logs:
        sq_cur.execute("""
            SELECT id FROM admin_activity_logs 
            WHERE timestamp = ? AND action = ? AND (report_id = ? OR (report_id IS NULL AND ? IS NULL))
        """, (l["timestamp"], l["action"], l.get("report_id"), l.get("report_id")))
        if not sq_cur.fetchone():
            if not args.dry_run:
                sq_cur.execute("""
                    INSERT INTO admin_activity_logs (
                        admin_id, username, action, report_id, previous_status, new_status, details, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    l.get("admin_id"), l.get("username"), l["action"], l.get("report_id"),
                    l.get("previous_status"), l.get("new_status"), l.get("details"), l["timestamp"]
                ))
            synced_logs += 1

    if args.dry_run:
        print("[DRY-RUN RESULTS]")
        print(f"  - Reports:       {synced_reports} new to insert, {updated_reports} to update")
        print(f"  - Admins:        {synced_admins} new to insert, {updated_admins} to update")
        print(f"  - Activity Logs: {synced_logs} new to insert")
        print("Dry run completed: Zero modifications committed to SQLite.")
    else:
        sq_conn.commit()
        sq_cur.execute("SELECT COUNT(*) FROM reports;")
        tot_rep = sq_cur.fetchone()[0]
        sq_cur.execute("SELECT COUNT(*) FROM admins;")
        tot_adm = sq_cur.fetchone()[0]
        sq_cur.execute("SELECT COUNT(*) FROM admin_activity_logs;")
        tot_log = sq_cur.fetchone()[0]

        print("[LIVE REVERSE SYNC COMPLETED]")
        print(f"  - Total Reports in SQLite:       {tot_rep} ({synced_reports} new, {updated_reports} updated)")
        print(f"  - Total Admins in SQLite:        {tot_adm}")
        print(f"  - Total Activity Logs in SQLite: {tot_log}")
        print("Rollback synchronization from PostgreSQL to SQLite completed successfully.")

    print("==================================================")
    sq_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    sync()

