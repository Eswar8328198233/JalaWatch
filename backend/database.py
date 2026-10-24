import sqlite3
import os
from contextlib import contextmanager

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_env = os.environ.get("DATABASE_PATH", "jalawatch.db")
if not os.path.isabs(db_env):
    DB_PATH = os.path.join(BASE_DIR, db_env)
else:
    DB_PATH = db_env

def get_db_connection():
    """Returns a SQLite connection with row_factory set to sqlite3.Row for dict-like access."""
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    """Context manager for safe database transactions."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes the database schema with necessary tables and indexes."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Admins Table
        cursor.execute("""
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

        # Reports Table
        cursor.execute("""
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
                is_demo INTEGER DEFAULT 0
            );
        """)

        # Indexes for fast search and filtering
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_village ON reports(village);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);")
