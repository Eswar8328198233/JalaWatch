#!/usr/bin/env python3
"""
JalaWatch V2 Database Migration Script
Safely applies schema additions for Location Intelligence, Extended Observations,
RBAC, Field Operations, and Follow-up Notes across both SQLite and Neon PostgreSQL.
"""
import os
import sys
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
from database import get_db, is_postgres, get_engine_name, DB_PATH

def migrate_database(conn, engine_name):
    cursor = conn.cursor()
    print(f"[Migration] Migrating {engine_name} schema...")

    # 1. New columns for reports table
    report_columns = [
        ("district", "TEXT"),
        ("state", "TEXT"),
        ("water_appearance", "TEXT"),
        ("water_smell", "TEXT"),
        ("water_usage", "TEXT"),
        ("issue_duration", "TEXT"),
        ("nearby_wastewater", "TEXT"),
        ("suspected_distance", "TEXT"),
        ("additional_notes", "TEXT"),
        ("priority", "TEXT DEFAULT 'Medium'"),
        ("assigned_to", "TEXT"),
        ("report_reference_no", "TEXT"),
        ("sample_collection_date", "TEXT")
    ]

    # Get existing columns of reports
    if engine_name == "PostgreSQL":
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'reports'
        """)
        existing_report_cols = {row["column_name"] for row in cursor.fetchall()}
    else:
        cursor.execute("PRAGMA table_info(reports);")
        existing_report_cols = {row["name"] for row in cursor.fetchall()}

    for col_name, col_type in report_columns:
        if col_name not in existing_report_cols:
            print(f"  + Adding column 'reports.{col_name}' ({col_type})")
            cursor.execute(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type};")
        else:
            print(f"  = Column 'reports.{col_name}' already exists.")

    # 2. Columns for admins table
    admin_columns = [
        ("failed_logins", "INTEGER DEFAULT 0"),
        ("locked_until", "TEXT"),
        ("phone", "TEXT")
    ]

    if engine_name == "PostgreSQL":
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admins'
        """)
        existing_admin_cols = {row["column_name"] for row in cursor.fetchall()}
    else:
        cursor.execute("PRAGMA table_info(admins);")
        existing_admin_cols = {row["name"] for row in cursor.fetchall()}

    for col_name, col_type in admin_columns:
        if col_name not in existing_admin_cols:
            print(f"  + Adding column 'admins.{col_name}' ({col_type})")
            cursor.execute(f"ALTER TABLE admins ADD COLUMN {col_name} {col_type};")
        else:
            print(f"  = Column 'admins.{col_name}' already exists.")

    # 3. Create report_followup_notes table
    if engine_name == "PostgreSQL":
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS report_followup_notes (
                id SERIAL PRIMARY KEY,
                report_id VARCHAR(50) NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
                officer_id VARCHAR(100),
                officer_name VARCHAR(150) NOT NULL,
                note TEXT NOT NULL,
                created_at VARCHAR(100) NOT NULL
            );
        """)
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS report_followup_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
                officer_id TEXT,
                officer_name TEXT NOT NULL,
                note TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)
    print("  + Table 'report_followup_notes' verified.")

    # 4. Indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_assigned ON reports(assigned_to);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notes_report ON report_followup_notes(report_id);")
    print("  + Indexes created/verified.")

def run_migrations():
    # Run on active DB (PostgreSQL or SQLite)
    with get_db() as conn:
        migrate_database(conn, get_engine_name())

    # Also run on local SQLite file to ensure offline parity
    if is_postgres() and os.path.exists(DB_PATH):
        print(f"\n[Migration] Also applying migrations to local SQLite replica ({DB_PATH})...")
        conn_sqlite = sqlite3.connect(DB_PATH)
        conn_sqlite.row_factory = sqlite3.Row
        try:
            migrate_database(conn_sqlite, "SQLite")
            conn_sqlite.commit()
            print("[Migration] SQLite replica migration committed successfully.")
        finally:
            conn_sqlite.close()

    print("\n[Migration] All database schema migrations completed successfully.")

if __name__ == "__main__":
    run_migrations()
