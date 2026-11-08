import os
import sqlite3
import socket
import struct
import urllib.parse
from contextlib import contextmanager
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

# Load environment variables in cascading order (local .env.local, root .env, backend .env)
for env_path in [
    os.path.join(ROOT_DIR, ".env.local"),
    os.path.join(ROOT_DIR, ".env"),
    os.path.join(BASE_DIR, ".env"),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)

try:
    import psycopg2
    import psycopg2.extras
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

db_env = os.environ.get("DATABASE_PATH", "jalawatch.db")
if not os.path.isabs(db_env):
    DB_PATH = os.path.join(BASE_DIR, db_env)
else:
    DB_PATH = db_env

_HOST_CACHE = {}

def resolve_hostname_fallback(hostname, dns_servers=("8.8.8.8", "1.1.1.1")):
    """
    Lightweight fallback DNS resolver for environments or ISPs (e.g. Jio/Reliance)
    where recursive DNS fails to resolve cloud database hostnames (*.neon.tech).
    Queries Google (8.8.8.8) or Cloudflare (1.1.1.1) public DNS via standard UDP port 53.
    Caches resolved IP in-memory to avoid redundant UDP packets.
    """
    if hostname in _HOST_CACHE:
        return _HOST_CACHE[hostname]

    try:
        ip = socket.gethostbyname(hostname)
        _HOST_CACHE[hostname] = ip
        return ip
    except Exception:
        pass

    for dns_server in dns_servers:
        try:
            packet = b"\xaa\xbb\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00"
            for part in hostname.split("."):
                packet += struct.pack("B", len(part)) + part.encode()
            packet += b"\x00\x00\x01\x00\x01"
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(2.5)
            sock.sendto(packet, (dns_server, 53))
            data, _ = sock.recvfrom(1024)
            sock.close()
            idx = 12
            while data[idx] != 0:
                idx += 1 + data[idx]
            idx += 5
            ancount = struct.unpack("!H", data[6:8])[0]
            for _ in range(ancount):
                if idx >= len(data):
                    break
                if data[idx] & 0xC0 == 0xC0:
                    idx += 2
                else:
                    while data[idx] != 0:
                        idx += 1 + data[idx]
                    idx += 1
                rtype, rclass, ttl, rdlen = struct.unpack("!HHIH", data[idx:idx + 10])
                idx += 10
                if rtype == 1 and rdlen == 4:
                    ip = socket.inet_ntoa(data[idx:idx + 4])
                    _HOST_CACHE[hostname] = ip
                    return ip
                idx += rdlen
        except Exception:
            continue
    return None

def connect_postgres(pg_url):
    """
    Connects to PostgreSQL with automatic SSL enforcement and DNS fallback.
    If local recursive DNS fails on cloud endpoints, routes via resolved hostaddr.
    """
    try:
        return psycopg2.connect(pg_url)
    except psycopg2.OperationalError as e:
        err_msg = str(e).lower()
        if "could not translate host name" in err_msg or "getaddrinfo failed" in err_msg:
            parsed = urllib.parse.urlparse(pg_url)
            if parsed.hostname:
                fallback_ip = resolve_hostname_fallback(parsed.hostname)
                if fallback_ip:
                    return psycopg2.connect(pg_url, hostaddr=fallback_ip)
        raise

def get_database_url():
    """Returns PostgreSQL connection URL if set in environment, or None for SQLite."""
    url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("DATABASE_URL_UNPOOLED")
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
        conn = connect_postgres(pg_url)
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
    """Initializes the database schema with necessary tables, indexes, and laboratory verification columns."""
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

            cursor.execute("""
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

            cursor.execute("""
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

            # Safe automated schema migration for existing SQLite database
            try:
                cursor.execute("PRAGMA table_info(reports);")
                existing_cols = {row["name"] for row in cursor.fetchall()}
                lab_columns = [
                    ("ph", "REAL"),
                    ("tds", "REAL"),
                    ("fluoride", "REAL"),
                    ("nitrate", "REAL"),
                    ("e_coli", "TEXT"),
                    ("lab_name", "TEXT"),
                    ("testing_date", "TEXT"),
                    ("lab_certificate_url", "TEXT"),
                    ("lab_notes", "TEXT"),
                    ("lab_status", "TEXT DEFAULT 'Not Tested'")
                ]
                for col_name, col_type in lab_columns:
                    if col_name not in existing_cols:
                        cursor.execute(f"ALTER TABLE reports ADD COLUMN {col_name} {col_type};")
            except Exception as e:
                print(f"[Database Migration Warning] {e}")

        # Indexes for fast search, filtering, and activity audit
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_village ON reports(village);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_created ON admin_activity_logs(timestamp DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_activity_report ON admin_activity_logs(report_id);")
