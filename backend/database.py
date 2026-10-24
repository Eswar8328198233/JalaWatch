import os
import sqlite3
from contextlib import contextmanager

try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_env = os.environ.get("DATABASE_PATH", "jalawatch.db")
if not os.path.isabs(db_env):
    DB_PATH = os.path.join(BASE_DIR, db_env)
else:
    DB_PATH = db_env

def get_database_url():
    """Returns PostgreSQL connection URL if set in environment, or None for SQLite."""
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("SUPABASE_DB_URL")
        or os.environ.get("POSTGRESQL_URL")
    )
    if url and (url.startswith("postgres://") or url.startswith("postgresql://")):
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    return None

def is_postgres():
    """Returns True if PostgreSQL is configured and psycopg2 is available."""
    return get_database_url() is not None and PSYCOPG2_AVAILABLE

def get_engine_name():
    """Returns a friendly string of the active database engine."""
    if is_postgres():
        return "PostgreSQL"
    return "SQLite"

class PostgresCursorWrapper:
    """
    Wraps a psycopg2 cursor to translate SQLite '?' placeholders to PostgreSQL '%s'
    and provide consistent dictionary-like row access.
    """
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        pg_query = query.replace("?", "%s")
        if params is not None:
            return self._cursor.execute(pg_query, params)
        return self._cursor.execute(pg_query)

    def executemany(self, query, seq_of_params):
        pg_query = query.replace("?", "%s")
        return self._cursor.executemany(pg_query, seq_of_params)

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def __getattr__(self, name):
        return getattr(self._cursor, name)

class PostgresConnectionWrapper:
    """Wraps psycopg2 connection to return PostgresCursorWrapper."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return PostgresCursorWrapper(self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor))

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)

def get_db_connection():
    """
    Returns an active database connection.
    Prioritizes managed PostgreSQL if DATABASE_URL is configured,
    otherwise connects to persistent SQLite file.
    """
    pg_url = get_database_url()
    if pg_url:
        if not PSYCOPG2_AVAILABLE:
            raise RuntimeError(
                "DATABASE_URL is configured but psycopg2 is not installed. Install psycopg2-binary."
            )
        conn = psycopg2.connect(pg_url)
        return PostgresConnectionWrapper(conn)

    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db():
    """Context manager for safe database transactions across PostgreSQL and SQLite."""
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

        if is_postgres():
            # PostgreSQL schema
            cursor.execute("""
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

            cursor.execute("""
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
        else:
            # SQLite schema
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
