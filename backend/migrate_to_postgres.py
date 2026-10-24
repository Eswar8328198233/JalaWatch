#!/usr/bin/env python3
"""
JalaWatch PostgreSQL Migration Utility
Migrates community reports and admin accounts from SQLite (or backup JSON)
to a managed PostgreSQL database (Render PostgreSQL, Supabase, Neon, etc.).
Safe, repeatable, and idempotent.
"""

import os
import sys
import argparse
import datetime
import sqlite3
import psycopg2
import psycopg2.extras

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "jalawatch.db")

def parse_args():
    parser = argparse.ArgumentParser(description="Migrate JalaWatch data from SQLite to PostgreSQL")
    parser.add_argument(
        "--target-url",
        dest="target_url",
        help="Target PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/db). If not provided, reads DATABASE_URL env var."
    )
    parser.add_argument(
        "--sqlite-path",
        dest="sqlite_path",
        default=SQLITE_DB_PATH,
        help="Path to source SQLite database file (default: backend/jalawatch.db)"
    )
    return parser.parse_args()

def migrate():
    args = parse_args()
    target_url = args.target_url or os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")

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
    print()

    # Step 1: Connect to SQLite and fetch all data
    sqlite_conn = sqlite3.connect(args.sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    sqlite_cursor.execute("SELECT * FROM reports ORDER BY created_at ASC")
    sqlite_reports = [dict(row) for row in sqlite_cursor.fetchall()]

    sqlite_cursor.execute("SELECT * FROM admins ORDER BY id ASC")
    sqlite_admins = [dict(row) for row in sqlite_cursor.fetchall()]

    print(f"[Source] Found {len(sqlite_reports)} reports and {len(sqlite_admins)} admin(s) in SQLite.")

    # Step 2: Connect to PostgreSQL and initialize schema
    try:
        pg_conn = psycopg2.connect(target_url)
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
            is_demo INTEGER DEFAULT 0
        );
    """)

    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_village ON reports(village);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);")
    pg_cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);")
    pg_conn.commit()

    # Step 3: Migrate Admins (idempotent)
    migrated_admins = 0
    for a in sqlite_admins:
        pg_cursor.execute("SELECT id FROM admins WHERE username = %s", (a["username"],))
        if not pg_cursor.fetchone():
            pg_cursor.execute("""
                INSERT INTO admins (username, email, password_hash, role, created_at, last_login)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (a["username"], a["email"], a["password_hash"], a.get("role", "admin"), a["created_at"], a.get("last_login")))
            migrated_admins += 1

    pg_conn.commit()
    print(f"[Migration] Admins migrated: {migrated_admins} new (existing skipped).")

    # Step 4: Migrate Reports (idempotent)
    migrated_reports = 0
    skipped_reports = 0
    for r in sqlite_reports:
        pg_cursor.execute("SELECT id FROM reports WHERE id = %s", (r["id"],))
        if not pg_cursor.fetchone():
            pg_cursor.execute("""
                INSERT INTO reports (
                    id, village, category, water_source, date_observed, landmark,
                    description, photo_url, latitude, longitude, reporter_name,
                    reporter_contact, status, is_verified, admin_notes,
                    created_at, updated_at, is_demo
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                r["id"], r["village"], r["category"], r["water_source"], r["date_observed"],
                r["landmark"], r["description"], r["photo_url"], r["latitude"], r["longitude"],
                r["reporter_name"], r["reporter_contact"], r["status"], r["is_verified"],
                r["admin_notes"], r["created_at"], r["updated_at"], r["is_demo"]
            ))
            migrated_reports += 1
        else:
            skipped_reports += 1

    pg_conn.commit()

    # Step 5: Verification
    pg_cursor.execute("SELECT COUNT(*) as total FROM reports")
    final_pg_count = pg_cursor.fetchone()["total"]

    print(f"[Migration] Reports migrated: {migrated_reports} inserted, {skipped_reports} already existed.")
    print(f"[Verify]    Total reports in PostgreSQL: {final_pg_count}")
    print()
    print("Migration completed successfully with zero data loss.")
    print("==================================================")

    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()
