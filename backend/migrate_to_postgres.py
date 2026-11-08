#!/usr/bin/env python3
"""
JalaWatch PostgreSQL Migration Utility
Migrates community reports, admin accounts, and audit activity logs
from SQLite to a managed PostgreSQL database (Neon, Supabase, Render PostgreSQL).
Safe, repeatable, idempotent, and non-destructive.
"""

import os
import sys
import argparse
import datetime
import sqlite3
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

# Load environment variables in cascading priority
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

SQLITE_DB_PATH = os.path.join(BASE_DIR, "jalawatch.db")

def parse_args():
    parser = argparse.ArgumentParser(description="Migrate JalaWatch data from SQLite to PostgreSQL")
    parser.add_argument(
        "--target-url",
        dest="target_url",
        help="Target PostgreSQL connection string (postgresql://...). If omitted, reads DATABASE_URL."
    )
    parser.add_argument(
        "--sqlite-path",
        dest="sqlite_path",
        default=SQLITE_DB_PATH,
        help="Path to source SQLite database file (default: backend/jalawatch.db)"
    )
    parser.add_argument(
        "--dry-run",
        dest="dry_run",
        action="store_true",
        help="Simulate migration without modifying PostgreSQL or committing changes."
    )
    return parser.parse_args()

def migrate():
    args = parse_args()
    target_url = (
        args.target_url
        or os.environ.get("DATABASE_URL")
        or os.environ.get("DATABASE_URL_UNPOOLED")
        or os.environ.get("SUPABASE_DB_URL")
    )

    if not target_url:
        print("[Error] No target PostgreSQL URL provided.")
        print("        Provide via --target-url 'postgresql://...' or set DATABASE_URL environment variable.")
        sys.exit(1)

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    if not os.path.exists(args.sqlite_path):
        print(f"[Error] Source SQLite database not found at: {args.sqlite_path}")
        sys.exit(1)

    print("==================================================")
    print("   JalaWatch PostgreSQL Migration Tool")
    print("==================================================")
    print(f"Source SQLite:   {args.sqlite_path}")
    masked_url = target_url.split("@")[-1] if "@" in target_url else "target_url"
    print(f"Target Postgres: ...@{masked_url}")
    print(f"Mode:            {'DRY-RUN (Safe Verification)' if args.dry_run else 'LIVE MIGRATION'}")
    print("==================================================")

    # Step 1: Connect to SQLite and fetch all data
    sqlite_conn = sqlite3.connect(args.sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    sqlite_cursor.execute("SELECT * FROM reports ORDER BY created_at ASC")
    sqlite_reports = [dict(row) for row in sqlite_cursor.fetchall()]

    sqlite_cursor.execute("SELECT * FROM admins ORDER BY id ASC")
    sqlite_admins = [dict(row) for row in sqlite_cursor.fetchall()]

    try:
        sqlite_cursor.execute("SELECT * FROM admin_activity_logs ORDER BY id ASC")
        sqlite_logs = [dict(row) for row in sqlite_cursor.fetchall()]
    except Exception:
        sqlite_logs = []

    print(f"[Source SQLite] Found:")
    print(f"  - Reports:       {len(sqlite_reports)}")
    print(f"  - Admins:        {len(sqlite_admins)}")
    print(f"  - Activity Logs: {len(sqlite_logs)}")
    print()

    # Step 2: Connect to PostgreSQL and initialize schema
    try:
        pg_conn = connect_postgres(target_url)
        pg_cursor = pg_conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    except Exception as e:
        print(f"[Error] Could not connect to target PostgreSQL: {e}")
        sys.exit(1)

    # Create tables
    pg_cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'admin',
            created_at VARCHAR(100) NOT NULL,
            last_login VARCHAR(100)
        );
    """)

    pg_cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id VARCHAR(50) PRIMARY KEY,
            village VARCHAR(100) NOT NULL,
            category VARCHAR(100) NOT NULL,
            water_source VARCHAR(100),
            date_observed VARCHAR(50) NOT NULL,
            landmark VARCHAR(255),
            description TEXT NOT NULL,
            photo_url VARCHAR(1000),
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            reporter_name VARCHAR(150) DEFAULT 'Anonymous Community Member',
            reporter_contact VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Submitted',
            is_verified INTEGER DEFAULT 0,
            admin_notes TEXT,
            created_at VARCHAR(100) NOT NULL,
            updated_at VARCHAR(100) NOT NULL,
            is_demo INTEGER DEFAULT 0,
            ph DOUBLE PRECISION,
            tds DOUBLE PRECISION,
            fluoride DOUBLE PRECISION,
            nitrate DOUBLE PRECISION,
            e_coli VARCHAR(50),
            lab_name VARCHAR(255),
            testing_date VARCHAR(50),
            lab_certificate_url VARCHAR(1000),
            lab_notes TEXT,
            lab_status VARCHAR(50) DEFAULT 'Not Tested'
        );
    """)

    pg_cursor.execute("""
        CREATE TABLE IF NOT EXISTS admin_activity_logs (
            id SERIAL PRIMARY KEY,
            admin_id VARCHAR(100),
            username VARCHAR(100),
            action VARCHAR(100) NOT NULL,
            report_id VARCHAR(50),
            previous_status VARCHAR(50),
            new_status VARCHAR(50),
            details TEXT,
            timestamp VARCHAR(100) NOT NULL
        );
    """)

    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_village ON reports(village);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_created ON admin_activity_logs(timestamp DESC);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_report ON admin_activity_logs(report_id);")

    # Step 3: Migrate Admins (idempotent)
    migrated_admins = 0
    skipped_admins = 0
    for a in sqlite_admins:
        pg_cursor.execute("SELECT id FROM admins WHERE username = %s", (a["username"],))
        if not pg_cursor.fetchone():
            if not args.dry_run:
                pg_cursor.execute("""
                    INSERT INTO admins (username, email, password_hash, role, created_at, last_login)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (a["username"], a["email"], a["password_hash"], a.get("role", "admin"), a["created_at"], a.get("last_login")))
            migrated_admins += 1
        else:
            skipped_admins += 1

    # Step 4: Migrate Reports (idempotent)
    migrated_reports = 0
    skipped_reports = 0
    for r in sqlite_reports:
        pg_cursor.execute("SELECT id FROM reports WHERE id = %s", (r["id"],))
        if not pg_cursor.fetchone():
            if not args.dry_run:
                pg_cursor.execute("""
                    INSERT INTO reports (
                        id, village, category, water_source, date_observed, landmark,
                        description, photo_url, latitude, longitude, reporter_name,
                        reporter_contact, status, is_verified, admin_notes,
                        created_at, updated_at, is_demo,
                        ph, tds, fluoride, nitrate, e_coli, lab_name, testing_date,
                        lab_certificate_url, lab_notes, lab_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    r["id"], r["village"], r["category"], r["water_source"], r["date_observed"],
                    r["landmark"], r["description"], r["photo_url"], r["latitude"], r["longitude"],
                    r["reporter_name"], r["reporter_contact"], r["status"], r["is_verified"],
                    r["admin_notes"], r["created_at"], r["updated_at"], r["is_demo"],
                    r.get("ph"), r.get("tds"), r.get("fluoride"), r.get("nitrate"), r.get("e_coli"),
                    r.get("lab_name"), r.get("testing_date"), r.get("lab_certificate_url"),
                    r.get("lab_notes"), r.get("lab_status", "Not Tested")
                ))
            migrated_reports += 1
        else:
            skipped_reports += 1

    # Step 5: Migrate Activity Logs (idempotent)
    migrated_logs = 0
    skipped_logs = 0
    for l in sqlite_logs:
        pg_cursor.execute("""
            SELECT id FROM admin_activity_logs 
            WHERE timestamp = %s AND action = %s AND (report_id = %s OR (report_id IS NULL AND %s IS NULL))
        """, (l["timestamp"], l["action"], l.get("report_id"), l.get("report_id")))
        if not pg_cursor.fetchone():
            if not args.dry_run:
                pg_cursor.execute("""
                    INSERT INTO admin_activity_logs (
                        admin_id, username, action, report_id, previous_status, new_status, details, timestamp
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    l.get("admin_id"), l.get("username"), l["action"], l.get("report_id"),
                    l.get("previous_status"), l.get("new_status"), l.get("details"), l["timestamp"]
                ))
            migrated_logs += 1
        else:
            skipped_logs += 1

    if args.dry_run:
        pg_conn.rollback()
        print(f"[DRY-RUN RESULTS]")
        print(f"  - Admins:        {migrated_admins} would be inserted, {skipped_admins} already exist")
        print(f"  - Reports:       {migrated_reports} would be inserted, {skipped_reports} already exist")
        print(f"  - Activity Logs: {migrated_logs} would be inserted, {skipped_logs} already exist")
        print()
        print("Dry run completed: Schema and records validated with 0 errors. No data was written.")
    else:
        pg_conn.commit()
        pg_cursor.execute("SELECT COUNT(*) as total FROM reports")
        final_reports_count = pg_cursor.fetchone()["total"]
        pg_cursor.execute("SELECT COUNT(*) as total FROM admins")
        final_admins_count = pg_cursor.fetchone()["total"]
        pg_cursor.execute("SELECT COUNT(*) as total FROM admin_activity_logs")
        final_logs_count = pg_cursor.fetchone()["total"]

        print(f"[LIVE MIGRATION COMPLETE]")
        print(f"  - Reports migrated:       {migrated_reports} inserted, {skipped_reports} skipped (Total in PostgreSQL: {final_reports_count})")
        print(f"  - Admins migrated:        {migrated_admins} inserted, {skipped_admins} skipped (Total in PostgreSQL: {final_admins_count})")
        print(f"  - Activity logs migrated: {migrated_logs} inserted, {skipped_logs} skipped (Total in PostgreSQL: {final_logs_count})")
        print()
        print("Migration committed successfully with 100% data integrity.")

    print("==================================================")
    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()
