import os
import re
import uuid
import datetime
import csv
import io
import json
import math
import urllib.request
import urllib.parse
import urllib.error
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

# Load environment variables in cascading order (root .env.local, root .env, backend .env)
for env_path in [
    os.path.join(ROOT_DIR, ".env.local"),
    os.path.join(ROOT_DIR, ".env"),
    os.path.join(BASE_DIR, ".env"),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)

from database import get_db, init_db, get_engine_name
from auth import (
    hash_password,
    verify_password,
    generate_jwt_token,
    admin_required,
    role_required
)
from seed_data import seed
from rate_limiter import rate_limit

# Cloudinary Integration (optional durable object storage)
try:
    import cloudinary
    import cloudinary.uploader
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

def init_cloudinary():
    """Configures Cloudinary SDK via CLOUDINARY_URL or individual credentials."""
    if not CLOUDINARY_AVAILABLE:
        return False
    c_url = os.environ.get("CLOUDINARY_URL")
    if c_url:
        cloudinary.config(cloudinary_url=c_url, secure=True)
        return True
    c_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    c_key = os.environ.get("CLOUDINARY_API_KEY")
    c_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if c_name and c_key and c_secret:
        cloudinary.config(
            cloud_name=c_name,
            api_key=c_key,
            api_secret=c_secret,
            secure=True
        )
        return True
    return False

def is_cloudinary_configured():
    return bool(CLOUDINARY_AVAILABLE and init_cloudinary())

# Initialize on module load if credentials exist
init_cloudinary()

app = Flask(__name__)

# Allowed origins for CORS (Render production frontend, GitHub Pages, and local development)
ALLOWED_ORIGINS = [
    "https://jalawatch-web.onrender.com",
    "https://jalawatch.onrender.com",
    "https://eswar8328198233.github.io",
    "http://localhost:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5000",
]

cors_env = os.environ.get("CORS_ORIGINS", "")
if cors_env:
    ALLOWED_ORIGINS.extend([o.strip() for o in cors_env.split(",") if o.strip()])

# If CORS_ALLOW_ALL=0 is explicitly configured, use strict whitelist; otherwise allow wildcard
# to ensure React Native Expo Android app and web previews work smoothly without preflight blocks.
if os.environ.get("CORS_ALLOW_ALL", "1") == "0":
    CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}})
else:
    CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
upload_env = os.environ.get("UPLOAD_FOLDER", "uploads")
if not os.path.isabs(upload_env):
    UPLOAD_FOLDER = os.path.join(BASE_DIR, upload_env)
else:
    UPLOAD_FOLDER = upload_env

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 5 * 1024 * 1024))  # 5MB

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Ensure database tables and demo seed exist
init_db()
seed()

VALID_CATEGORIES = [
    "Unusual water colour",
    "Bad smell or taste",
    "Suspected waste dumping",
    "Drainage problems",
    "Leaking pipes",
    "Agricultural runoff",
    "Other"
]

VALID_STATUSES = ["Submitted", "Under Review", "Resolved", "Archived"]

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image_bytes(file_storage):
    """
    Verifies file header magic bytes to ensure file is an authentic image (JPEG, PNG, WEBP),
    preventing spoofed malicious uploads.
    """
    header = file_storage.read(16)
    file_storage.seek(0)
    if len(header) < 8:
        return False, None
    # JPEG: starts with FF D8 FF
    if header.startswith(b"\xff\xd8\xff"):
        return True, "jpeg"
    # PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return True, "png"
    # WEBP: starts with RIFF and bytes 8..12 are WEBP
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return True, "webp"
    return False, None

def log_admin_activity(cursor, admin_id, username, action, report_id=None, previous_status=None, new_status=None, details=None):
    """Records an audit trail log in admin_activity_logs."""
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        cursor.execute("""
            INSERT INTO admin_activity_logs (
                admin_id, username, action, report_id, previous_status, new_status, details, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(admin_id or ""), str(username or "Admin"), action,
            report_id, previous_status, new_status, details, now_str
        ))
    except Exception as e:
        print(f"[Activity Log Warning] {e}")

def format_report_public(row):
    """Sanitizes report row for public consumption by hiding private admin notes and reporter contacts."""
    d = dict(row)
    # Remove private columns
    d.pop("admin_notes", None)
    d.pop("reporter_contact", None)
    # Ensure boolean/formatted fields
    d["is_verified"] = bool(d.get("is_verified", 0))
    d["is_demo"] = bool(d.get("is_demo", 0))
    return d

def format_report_admin(row):
    """Formats full report row for administrative review."""
    d = dict(row)
    d["is_verified"] = bool(d.get("is_verified", 0))
    d["is_demo"] = bool(d.get("is_demo", 0))
    return d

def generate_report_id():
    """Generates unique report ID formatted as JW-2026-XXXX."""
    while True:
        suffix = f"{uuid.uuid4().int % 9000 + 1000}"
        report_id = f"JW-2026-{suffix}"
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM reports WHERE id = ?", (report_id,))
            if not cursor.fetchone():
                return report_id

# ----------------- ROUTES ----------------- #

@app.route("/api/health", methods=["GET"])
def health_check():
    """Readiness and liveness probe: verifies database connectivity and returns system health."""
    db_status = "connected"
    report_count = 0
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM reports")
            report_count = cursor.fetchone()["count"]
    except Exception as e:
        db_status = f"error: {str(e)}"

    is_healthy = db_status == "connected"
    status_code = 200 if is_healthy else 503

    return jsonify({
        "status": "healthy" if is_healthy else "unhealthy",
        "database": db_status,
        "database_engine": get_engine_name(),
        "storage": "cloudinary" if is_cloudinary_configured() else "local_disk",
        "total_reports": report_count,
        "service": "JalaWatch Groundwater Pollution Reporting API",
        "version": "1.0.0",
        "project": "Community Service Project (CSP) - Nutakki Village Study",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), status_code

_GEOCODE_CACHE = {}

@app.route("/api/geocode/reverse", methods=["GET"])
@rate_limit(max_requests=60, window_seconds=60, key_prefix="reverse_geocode", custom_message="Too many geocoding requests. Please wait a moment.")
def reverse_geocode():
    """
    Reverse geocodes (lat, lng) to human-readable address components.
    Uses an in-memory cache and OpenStreetMap Nominatim with strict rate compliance.
    """
    lat_str = request.args.get("lat", "").strip()
    lng_str = request.args.get("lng", "").strip()

    if not lat_str or not lng_str:
        return jsonify({"error": "Latitude and longitude query parameters are required"}), 400

    try:
        lat = float(lat_str)
        lng = float(lng_str)
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return jsonify({"error": "Coordinates out of bounds"}), 400
    except ValueError:
        return jsonify({"error": "Invalid coordinate format"}), 400

    cache_key = f"{round(lat, 4)},{round(lng, 4)}"
    if cache_key in _GEOCODE_CACHE:
        return jsonify({"status": "success", "cached": True, "address": _GEOCODE_CACHE[cache_key]}), 200

    url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lng}&zoom=18&addressdetails=1"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "JalaWatch-Community-Water-Portal/1.0 (nutakki-csp@jalawatch.org)"}
    )

    try:
        with urllib.request.urlopen(req, timeout=6) as response:
            if response.status == 200:
                raw_data = json.loads(response.read().decode())
                addr = raw_data.get("address", {})
                display_name = raw_data.get("display_name", "")

                village = (
                    addr.get("village")
                    or addr.get("hamlet")
                    or addr.get("town")
                    or addr.get("suburb")
                    or addr.get("neighbourhood")
                    or addr.get("city_district")
                    or addr.get("county")
                    or addr.get("city")
                    or ""
                )
                district = (
                    addr.get("state_district")
                    or addr.get("district")
                    or addr.get("county")
                    or ""
                )
                state = addr.get("state") or "Andhra Pradesh"
                street = (
                    addr.get("road")
                    or addr.get("residential")
                    or addr.get("pedestrian")
                    or addr.get("footway")
                    or ""
                )
                landmark = (
                    addr.get("amenity")
                    or addr.get("building")
                    or addr.get("natural")
                    or addr.get("landmark")
                    or addr.get("shop")
                    or addr.get("place")
                    or ""
                )

                parsed = {
                    "village": village,
                    "district": district,
                    "state": state,
                    "street": street,
                    "landmark": landmark,
                    "display_name": display_name
                }
                _GEOCODE_CACHE[cache_key] = parsed
                return jsonify({"status": "success", "cached": False, "address": parsed}), 200
            else:
                return jsonify({"error": f"Geocoding service returned status {response.status}"}), 502
    except Exception as e:
        return jsonify({
            "status": "partial",
            "warning": "Reverse geocoding service timeout or unreachable",
            "details": str(e),
            "address": {
                "village": "",
                "district": "",
                "state": "Andhra Pradesh",
                "street": "",
                "landmark": "",
                "display_name": f"{lat:.4f}° N, {lng:.4f}° E"
            }
        }), 200

@app.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    """Safely serves uploaded proof photos."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Returns high-level statistics for homepage counters and admin overview."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as total FROM reports")
        total = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'Submitted'")
        submitted = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'Under Review'")
        under_review = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM reports WHERE status = 'Resolved'")
        resolved = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(DISTINCT village) as count FROM reports")
        villages_count = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) as count FROM reports WHERE is_verified = 1")
        verified_count = cursor.fetchone()["count"]

        cursor.execute("SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY count DESC")
        category_breakdown = [{"category": row["category"], "count": row["count"]} for row in cursor.fetchall()]

        cursor.execute("SELECT village, COUNT(*) as count FROM reports GROUP BY village ORDER BY count DESC LIMIT 8")
        top_villages = [{"village": row["village"], "count": row["count"]} for row in cursor.fetchall()]

        cursor.execute("SELECT COALESCE(priority, 'Medium') as priority, COUNT(*) as count FROM reports GROUP BY priority ORDER BY count DESC")
        priority_breakdown = [{"priority": row["priority"], "count": row["count"]} for row in cursor.fetchall()]

        # Monthly report trends for analytical charts
        cursor.execute("""
            SELECT SUBSTR(date_observed, 1, 7) as month, COUNT(*) as count
            FROM reports
            WHERE date_observed IS NOT NULL AND length(date_observed) >= 7
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        """)
        monthly_trends = [{"month": row["month"], "count": row["count"]} for row in cursor.fetchall()]

        # Water source breakdown
        cursor.execute("""
            SELECT water_source, COUNT(*) as count
            FROM reports
            WHERE water_source IS NOT NULL AND water_source != ''
            GROUP BY water_source
            ORDER BY count DESC
        """)
        water_sources = [{"source": row["water_source"], "count": row["count"]} for row in cursor.fetchall()]

    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    return jsonify({
        "total_reports": total,
        "submitted": submitted,
        "under_review": under_review,
        "resolved": resolved,
        "verified_reports": verified_count,
        "resolution_rate": resolution_rate,
        "villages_impacted": villages_count,
        "category_breakdown": category_breakdown,
        "top_villages": top_villages,
        "priority_breakdown": priority_breakdown,
        "monthly_trends": monthly_trends,
        "water_sources": water_sources
    }), 200

@app.route("/api/reports", methods=["GET"])
def get_reports():
    """Retrieves paginated and filtered community reports for public viewing."""
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    village = request.args.get("village", "").strip()
    status = request.args.get("status", "").strip()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()
    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(1, int(request.args.get("limit", 20))))
    offset = (page - 1) * limit

    query = "SELECT * FROM reports WHERE 1=1"
    count_query = "SELECT COUNT(*) as total FROM reports WHERE 1=1"
    params = []

    if search:
        query += " AND (id LIKE ? OR village LIKE ? OR landmark LIKE ? OR description LIKE ?)"
        count_query += " AND (id LIKE ? OR village LIKE ? OR landmark LIKE ? OR description LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern])

    if category and category != "All":
        query += " AND category = ?"
        count_query += " AND category = ?"
        params.append(category)

    if village and village != "All":
        query += " AND village = ?"
        count_query += " AND village = ?"
        params.append(village)

    if status and status != "All":
        query += " AND status = ?"
        count_query += " AND status = ?"
        params.append(status)

    if date_from:
        query += " AND date_observed >= ?"
        count_query += " AND date_observed >= ?"
        params.append(date_from)

    if date_to:
        query += " AND date_observed <= ?"
        count_query += " AND date_observed <= ?"
        params.append(date_to)

    with get_db() as conn:
        cursor = conn.cursor()

        # Get total matching count
        cursor.execute(count_query, params)
        total_matching = cursor.fetchone()["total"]

        # Fetch paginated rows
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        fetch_params = params + [limit, offset]
        cursor.execute(query, fetch_params)
        rows = cursor.fetchall()

    reports = [format_report_public(row) for row in rows]
    total_pages = (total_matching + limit - 1) // limit if total_matching > 0 else 1

    return jsonify({
        "reports": reports,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_records": total_matching,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }), 200

@app.route("/api/reports/<report_id>", methods=["GET"])
def get_report_detail(report_id):
    """Retrieves single report details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()

    if not row:
        return jsonify({"error": "Report not found", "code": "NOT_FOUND"}), 404

    return jsonify({"report": format_report_public(row)}), 200

@app.route("/api/reports", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=300, key_prefix="report_submit", custom_message="Report submission rate limit reached (max 10 submissions per 5 minutes per IP). Please try again shortly.")
def submit_report():
    """Allows community members to report an issue without requiring login."""
    # Support both multipart form data (with file) and json
    if request.is_json:
        data = request.get_json() or {}
        file = None
    else:
        data = request.form.to_dict()
        file = request.files.get("photo", None)

    # Input extraction & trimming
    village = data.get("village", "").strip()
    category = data.get("category", "").strip()
    water_source = data.get("water_source", "").strip()
    date_observed = data.get("date_observed", "").strip()
    landmark = data.get("landmark", "").strip()
    description = data.get("description", "").strip()
    reporter_name = data.get("reporter_name", "").strip() or "Anonymous Community Member"
    reporter_contact = data.get("reporter_contact", "").strip()

    # Extended survey fields (Location & Field Intelligence)
    district = data.get("district", "").strip()
    state = data.get("state", "").strip() or "Andhra Pradesh"
    water_appearance = data.get("water_appearance", "").strip()
    water_smell = data.get("water_smell", "").strip()
    water_usage = data.get("water_usage", "").strip()
    issue_duration = data.get("issue_duration", "").strip()
    nearby_wastewater = data.get("nearby_wastewater", "").strip()
    suspected_distance = data.get("suspected_distance", "").strip()
    additional_notes = data.get("additional_notes", "").strip()
    priority = data.get("priority", "Medium").strip()
    if priority not in ["Low", "Medium", "High", "Urgent"]:
        priority = "Medium"

    # Lat/Lon extraction
    latitude = None
    longitude = None
    if data.get("latitude"):
        try:
            latitude = float(data.get("latitude"))
        except ValueError:
            pass

    if data.get("longitude"):
        try:
            longitude = float(data.get("longitude"))
        except ValueError:
            pass

    # Server-side validation
    errors = {}
    if not village or len(village) < 2 or len(village) > 100:
        errors["village"] = "Village/locality name must be between 2 and 100 characters."

    if not category or category not in VALID_CATEGORIES:
        errors["category"] = f"Please select a valid issue category from: {', '.join(VALID_CATEGORIES)}."

    if not description or len(description) < 15:
        errors["description"] = "Please provide a detailed description (minimum 15 characters)."
    elif len(description) > 3000:
        errors["description"] = "Description is too long (maximum 3000 characters)."

    if not date_observed:
        errors["date_observed"] = "Date observed is required."
    else:
        try:
            obs_date = datetime.date.fromisoformat(date_observed)
            if obs_date > datetime.date.today():
                errors["date_observed"] = "Date observed cannot be in the future."
        except ValueError:
            errors["date_observed"] = "Invalid date format. Use YYYY-MM-DD."

    # Handle file upload if present
    photo_url = None
    if file and file.filename:
        if not allowed_file(file.filename):
            errors["photo"] = "Allowed photo formats: .jpg, .jpeg, .png, .webp."
        else:
            is_valid_magic, detected_format = validate_image_bytes(file)
            if not is_valid_magic:
                errors["photo"] = "Uploaded file content signature does not match an authentic image format (JPEG, PNG, WEBP)."
            else:
                # Check length/size safely
                file.seek(0, os.SEEK_END)
                size = file.tell()
                file.seek(0)
                if size > MAX_CONTENT_LENGTH:
                    errors["photo"] = "Photo size exceeds the maximum limit of 5MB."
                else:
                    if is_cloudinary_configured():
                        try:
                            upload_res = cloudinary.uploader.upload(
                                file,
                                folder="jalawatch_reports",
                                resource_type="image",
                                allowed_formats=["jpg", "jpeg", "png", "webp"],
                                transformation=[{"quality": "auto", "fetch_format": "auto"}]
                            )
                            photo_url = upload_res.get("secure_url")
                        except Exception as e:
                            print(f"[Cloudinary Warning] Upload failed: {e}. Falling back to disk storage.")
                            file.seek(0)

                # Fallback to local disk storage if Cloudinary not configured or upload failed
                if not photo_url:
                    ext = file.filename.rsplit(".", 1)[1].lower()
                    clean_filename = f"{uuid.uuid4().hex}.{ext}"
                    save_path = os.path.join(app.config["UPLOAD_FOLDER"], clean_filename)
                    file.save(save_path)
                    photo_url = f"/uploads/{clean_filename}"

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    report_id = generate_report_id()
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Check for potential duplicates within ~150 meters logged within last 14 days
    nearby_duplicates = []
    if latitude is not None and longitude is not None:
        try:
            two_weeks_ago = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=14)).isoformat()
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, village, category, date_observed
                    FROM reports
                    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
                      AND created_at >= ?
                      AND ABS(latitude - ?) < 0.0015
                      AND ABS(longitude - ?) < 0.0015
                """, (two_weeks_ago, latitude, longitude))
                nearby_duplicates = [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            print(f"[Duplicate Check Warning] {e}")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reports (
                id, village, category, water_source, date_observed, landmark,
                description, photo_url, latitude, longitude, reporter_name,
                reporter_contact, status, is_verified, admin_notes,
                created_at, updated_at, is_demo,
                district, state, water_appearance, water_smell, water_usage,
                issue_duration, nearby_wastewater, suspected_distance,
                additional_notes, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 0, NULL, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id, village, category, water_source, date_observed, landmark,
            description, photo_url, latitude, longitude, reporter_name,
            reporter_contact, now_str, now_str,
            district or None, state or "Andhra Pradesh",
            water_appearance or None, water_smell or None, water_usage or None,
            issue_duration or None, nearby_wastewater or None, suspected_distance or None,
            additional_notes or None, priority
        ))

    return jsonify({
        "message": "Report submitted successfully. Thank you for contributing to groundwater awareness.",
        "report_id": report_id,
        "status": "Submitted",
        "priority": priority,
        "is_verified": False,
        "duplicate_warning": len(nearby_duplicates) > 0,
        "nearby_count": len(nearby_duplicates),
        "disclaimer": "This report is an unverified civic observation. Qualified laboratory water testing is recommended before confirming safety."
    }), 201

# ----------------- ADMIN AUTH & MANAGEMENT ----------------- #

@app.route("/api/auth/login", methods=["POST"])
@rate_limit(max_requests=10, window_seconds=60, key_prefix="admin_login", custom_message="Too many failed login attempts. Please wait 1 minute before retrying.")
def admin_login():
    """Authenticates administrator/officer and returns a JWT token with RBAC role."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    now = datetime.datetime.now(datetime.timezone.utc)
    now_str = now.isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM admins WHERE username = ? OR email = ?", (username, username))
        admin = cursor.fetchone()

        if not admin:
            return jsonify({"error": "Invalid username or password"}), 401

        # Check account lockout
        locked_until_str = admin.get("locked_until")
        if locked_until_str:
            try:
                locked_until = datetime.datetime.fromisoformat(locked_until_str)
                if now < locked_until:
                    remaining_mins = int((locked_until - now).total_seconds() // 60) + 1
                    return jsonify({
                        "error": f"Account is temporarily locked due to consecutive failed attempts. Try again in {remaining_mins} minute(s).",
                        "code": "ACCOUNT_LOCKED"
                    }), 403
            except Exception:
                pass

        # Verify password
        if not verify_password(password, admin["password_hash"]):
            failed_count = (admin.get("failed_logins") or 0) + 1
            if failed_count >= 5:
                lock_time = (now + datetime.timedelta(minutes=15)).isoformat()
                cursor.execute("UPDATE admins SET failed_logins = ?, locked_until = ? WHERE id = ?", (failed_count, lock_time, admin["id"]))
                log_admin_activity(
                    cursor, admin["id"], admin["username"], "ACCOUNT_LOCKED",
                    details=f"Account locked for 15 minutes after {failed_count} failed login attempts."
                )
                return jsonify({
                    "error": "Account locked for 15 minutes due to 5 consecutive failed login attempts.",
                    "code": "ACCOUNT_LOCKED"
                }), 403
            else:
                cursor.execute("UPDATE admins SET failed_logins = ? WHERE id = ?", (failed_count, admin["id"]))
                return jsonify({
                    "error": f"Invalid username or password. {5 - failed_count} attempt(s) remaining before lockout."
                }), 401

        # Success - reset failed logins and lockout
        cursor.execute("UPDATE admins SET failed_logins = 0, locked_until = NULL, last_login = ? WHERE id = ?", (now_str, admin["id"]))
        log_admin_activity(
            cursor, admin["id"], admin["username"], "LOGIN_SUCCESS",
            details="Admin successfully authenticated."
        )

    role = admin.get("role") or "admin"
    token = generate_jwt_token(admin["id"], admin["username"], admin["email"], role=role)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "email": admin["email"],
            "role": role
        }
    }), 200

@app.route("/api/auth/me", methods=["GET"])
@admin_required
def get_current_admin():
    """Validates token and returns current admin context including RBAC role."""
    admin_info = request.admin
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, role, last_login, created_at FROM admins WHERE id = ?", (admin_info.get("sub"),))
        admin = cursor.fetchone()

    if not admin:
        return jsonify({
            "admin": {
                "id": admin_info.get("sub"),
                "username": admin_info.get("username"),
                "email": admin_info.get("email"),
                "role": admin_info.get("role", "admin")
            }
        }), 200

    return jsonify({
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "email": admin["email"],
            "role": admin.get("role") or "admin",
            "last_login": admin.get("last_login")
        }
    }), 200

@app.route("/api/admin/change-password", methods=["PUT"])
@admin_required
def admin_change_password():
    """Allows authenticated admin/officer to securely update their own password."""
    data = request.get_json() or {}
    current_password = data.get("current_password", "").strip()
    new_password = data.get("new_password", "").strip()

    if not current_password or not new_password:
        return jsonify({"error": "Current and new passwords are required"}), 400

    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters long"}), 400

    admin_user = request.admin
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM admins WHERE id = ?", (admin_user.get("sub"),))
        admin = cursor.fetchone()

        if not admin or not verify_password(current_password, admin["password_hash"]):
            return jsonify({"error": "Current password is incorrect"}), 400

        new_hash = hash_password(new_password)
        cursor.execute("UPDATE admins SET password_hash = ? WHERE id = ?", (new_hash, admin["id"]))
        log_admin_activity(
            cursor, admin["id"], admin["username"], "PASSWORD_CHANGED",
            details="User successfully updated account password."
        )

    return jsonify({"message": "Password changed successfully"}), 200

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_list_users():
    """Lists system administrative users and field officers."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, email, role, created_at, last_login, failed_logins, locked_until FROM admins ORDER BY id ASC")
        users = [dict(u) for u in cursor.fetchall()]
    return jsonify({"users": users, "count": len(users)}), 200

@app.route("/api/admin/users", methods=["POST"])
@role_required(["super_admin", "admin"])
def admin_create_user():
    """Creates a new administrative user or field officer."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "field_officer").strip()

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if role not in ["super_admin", "admin", "field_officer"]:
        return jsonify({"error": "Role must be 'super_admin', 'admin', or 'field_officer'"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    pwd_hash = hash_password(password)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM admins WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            return jsonify({"error": "Username or email already exists"}), 400

        cursor.execute("""
            INSERT INTO admins (username, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (username, email, pwd_hash, role, now_str))

        creator = request.admin
        log_admin_activity(
            cursor, creator.get("sub"), creator.get("username"), "USER_CREATED",
            details=f"Created {role} account '{username}' ({email})."
        )

    return jsonify({"message": f"User '{username}' created successfully as {role}"}), 201

@app.route("/api/admin/users/<int:user_id>/role", methods=["PUT"])
@role_required(["super_admin"])
def admin_update_user_role(user_id):
    """Updates user role (Super Admin only)."""
    data = request.get_json() or {}
    new_role = data.get("role", "").strip()
    if new_role not in ["super_admin", "admin", "field_officer"]:
        return jsonify({"error": "Role must be 'super_admin', 'admin', or 'field_officer'"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, role FROM admins WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404

        cursor.execute("UPDATE admins SET role = ? WHERE id = ?", (new_role, user_id))
        creator = request.admin
        log_admin_activity(
            cursor, creator.get("sub"), creator.get("username"), "ROLE_CHANGED",
            details=f"Changed user '{user['username']}' role from {user['role']} to {new_role}."
        )

    return jsonify({"message": f"Updated {user['username']}'s role to {new_role}"}), 200

@app.route("/api/admin/reports", methods=["GET"])
@admin_required
def admin_get_reports():
    """Admin endpoint: lists all reports including private admin notes and reporter contact with advanced filtering & sorting."""
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    village = request.args.get("village", "").strip()
    priority = request.args.get("priority", "").strip()
    assigned_to = request.args.get("assigned_to", "").strip()
    sort_by = request.args.get("sort_by", "date_desc").strip()

    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if search:
        query += " AND (id LIKE ? OR village LIKE ? OR landmark LIKE ? OR description LIKE ? OR reporter_name LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern, pattern])

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

    if village and village != "All":
        query += " AND village = ?"
        params.append(village)

    if priority and priority != "All":
        query += " AND priority = ?"
        params.append(priority)

    if assigned_to and assigned_to != "All":
        query += " AND assigned_to = ?"
        params.append(assigned_to)

    if sort_by == "date_asc":
        query += " ORDER BY created_at ASC"
    elif sort_by == "priority":
        query += """ ORDER BY CASE priority
            WHEN 'Urgent' THEN 1
            WHEN 'High' THEN 2
            WHEN 'Medium' THEN 3
            WHEN 'Low' THEN 4
            ELSE 5 END ASC, created_at DESC"""
    elif sort_by == "status":
        query += " ORDER BY status ASC, created_at DESC"
    else:
        query += " ORDER BY created_at DESC"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    reports = [format_report_admin(row) for row in rows]
    return jsonify({"reports": reports, "count": len(reports)}), 200

@app.route("/api/admin/reports/<report_id>/status", methods=["PUT"])
@admin_required
def admin_update_report_status(report_id):
    """Admin endpoint: updates report status, admin notes, or verification mark."""
    data = request.get_json() or {}
    new_status = data.get("status", "").strip()
    admin_notes = data.get("admin_notes", None)
    is_verified = data.get("is_verified", None)

    if new_status and new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Must be one of {VALID_STATUSES}"}), 400

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Report not found"}), 404

        # Build dynamic update statement
        updates = ["updated_at = ?"]
        params = [now_str]

        if new_status:
            updates.append("status = ?")
            params.append(new_status)

        if admin_notes is not None:
            updates.append("admin_notes = ?")
            params.append(admin_notes.strip())

        if is_verified is not None:
            updates.append("is_verified = ?")
            params.append(1 if is_verified else 0)

        params.append(report_id)
        update_query = f"UPDATE reports SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(update_query, params)

        # Log admin activity
        admin_user = request.admin
        log_admin_activity(
            cursor,
            admin_user.get("sub"),
            admin_user.get("username"),
            "STATUS_UPDATE",
            report_id,
            existing["status"],
            new_status or existing["status"],
            f"Updated status to '{new_status or existing['status']}'. Verified: {is_verified}."
        )

        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        updated_row = cursor.fetchone()

    return jsonify({
        "message": "Report status updated successfully",
        "report": format_report_admin(updated_row)
    }), 200

@app.route("/api/admin/reports/<report_id>/lab-test", methods=["PUT"])
@admin_required
def admin_record_lab_test(report_id):
    """Admin endpoint: logs certified laboratory water testing results with strict validation."""
    data = request.get_json() or {}
    
    # Extract laboratory parameters
    ph = data.get("ph")
    tds = data.get("tds")
    fluoride = data.get("fluoride")
    nitrate = data.get("nitrate")
    e_coli = data.get("e_coli", "").strip() if data.get("e_coli") is not None else None
    lab_name = data.get("lab_name", "").strip()
    testing_date = data.get("testing_date", "").strip()
    lab_certificate_url = data.get("lab_certificate_url", "").strip()
    lab_notes = data.get("lab_notes", "").strip()
    lab_status = data.get("lab_status", "Tested").strip()
    report_reference_no = data.get("report_reference_no", "").strip() if data.get("report_reference_no") else None
    sample_collection_date = data.get("sample_collection_date", "").strip() if data.get("sample_collection_date") else None
    is_verified = bool(data.get("is_verified", True))

    # Validate physical parameters if provided
    errors = {}
    if ph is not None:
        try:
            ph = float(ph)
            if ph < 0 or ph > 14:
                errors["ph"] = "pH must be between 0.0 and 14.0"
        except (ValueError, TypeError):
            errors["ph"] = "Invalid pH value (must be a number)"

    if tds is not None:
        try:
            tds = float(tds)
            if tds < 0:
                errors["tds"] = "TDS must be a positive number in mg/L"
        except (ValueError, TypeError):
            errors["tds"] = "Invalid TDS value"

    if fluoride is not None:
        try:
            fluoride = float(fluoride)
            if fluoride < 0:
                errors["fluoride"] = "Fluoride must be positive in mg/L"
        except (ValueError, TypeError):
            errors["fluoride"] = "Invalid Fluoride value"

    if nitrate is not None:
        try:
            nitrate = float(nitrate)
            if nitrate < 0:
                errors["nitrate"] = "Nitrate must be positive in mg/L"
        except (ValueError, TypeError):
            errors["nitrate"] = "Invalid Nitrate value"

    if errors:
        return jsonify({"error": "Validation failed for laboratory parameters", "details": errors}), 400

    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Report not found"}), 404

        cursor.execute("""
            UPDATE reports SET
                ph = ?, tds = ?, fluoride = ?, nitrate = ?, e_coli = ?,
                lab_name = ?, testing_date = ?, lab_certificate_url = ?,
                lab_notes = ?, lab_status = ?, is_verified = ?,
                report_reference_no = ?, sample_collection_date = ?, updated_at = ?
            WHERE id = ?
        """, (
            ph, tds, fluoride, nitrate, e_coli,
            lab_name, testing_date, lab_certificate_url,
            lab_notes, lab_status, 1 if is_verified else 0,
            report_reference_no, sample_collection_date, now_str, report_id
        ))

        admin_user = request.admin
        log_admin_activity(
            cursor,
            admin_user.get("sub"),
            admin_user.get("username"),
            "LAB_VERIFICATION",
            report_id,
            existing["status"],
            existing["status"],
            f"Recorded laboratory test from {lab_name or 'NABL/RWS&S Lab'} (pH: {ph}, TDS: {tds}, Status: {lab_status})"
        )

        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        updated_row = cursor.fetchone()

    return jsonify({
        "message": "Certified laboratory test results recorded successfully",
        "report": format_report_admin(updated_row)
    }), 200

# ----------------- FIELD OPERATIONS & NOTES ----------------- #

@app.route("/api/admin/reports/<report_id>/priority", methods=["PUT"])
@admin_required
def admin_set_priority(report_id):
    """Sets investigation priority (Low, Medium, High, Urgent)."""
    data = request.get_json() or {}
    priority = data.get("priority", "Medium").strip()
    if priority not in ["Low", "Medium", "High", "Urgent"]:
        return jsonify({"error": "Priority must be Low, Medium, High, or Urgent"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, priority FROM reports WHERE id = ?", (report_id,))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Report not found"}), 404

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("UPDATE reports SET priority = ?, updated_at = ? WHERE id = ?", (priority, now_str, report_id))

        admin_user = request.admin
        log_admin_activity(
            cursor, admin_user.get("sub"), admin_user.get("username"), "PRIORITY_CHANGE",
            report_id, details=f"Changed priority to {priority} (was {existing.get('priority', 'Medium')})."
        )
        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        updated = cursor.fetchone()

    return jsonify({"message": f"Priority updated to {priority}", "report": format_report_admin(updated)}), 200

@app.route("/api/admin/reports/<report_id>/assign", methods=["PUT"])
@admin_required
def admin_assign_report(report_id):
    """Assigns report to a field officer or administrative team member."""
    data = request.get_json() or {}
    assigned_to = data.get("assigned_to", "").strip()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, assigned_to FROM reports WHERE id = ?", (report_id,))
        existing = cursor.fetchone()
        if not existing:
            return jsonify({"error": "Report not found"}), 404

        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("UPDATE reports SET assigned_to = ?, updated_at = ? WHERE id = ?", (assigned_to or None, now_str, report_id))

        admin_user = request.admin
        log_admin_activity(
            cursor, admin_user.get("sub"), admin_user.get("username"), "REPORT_ASSIGNED",
            report_id, details=f"Assigned report to '{assigned_to or 'Unassigned'}'."
        )
        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        updated = cursor.fetchone()

    return jsonify({"message": f"Report assigned to {assigned_to or 'Unassigned'}", "report": format_report_admin(updated)}), 200

@app.route("/api/admin/reports/<report_id>/notes", methods=["GET"])
@admin_required
def admin_get_report_notes(report_id):
    """Retrieves internal follow-up notes for an investigation."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, report_id, officer_id, officer_name, note, created_at
            FROM report_followup_notes
            WHERE report_id = ?
            ORDER BY created_at ASC
        """, (report_id,))
        notes = [dict(n) for n in cursor.fetchall()]
    return jsonify({"notes": notes, "count": len(notes)}), 200

@app.route("/api/admin/reports/<report_id>/notes", methods=["POST"])
@admin_required
def admin_add_report_note(report_id):
    """Adds internal follow-up note to a report."""
    data = request.get_json() or {}
    note_text = data.get("note", "").strip()
    if not note_text:
        return jsonify({"error": "Note text cannot be empty"}), 400

    admin_user = request.admin
    officer_name = admin_user.get("username") or "Admin Officer"
    officer_id = str(admin_user.get("sub") or "")
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM reports WHERE id = ?", (report_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Report not found"}), 404

        cursor.execute("""
            INSERT INTO report_followup_notes (report_id, officer_id, officer_name, note, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (report_id, officer_id, officer_name, note_text, now_str))

        log_admin_activity(
            cursor, officer_id, officer_name, "NOTE_ADDED",
            report_id, details=f"Added internal inspection note: '{note_text[:80]}...'"
        )

    return jsonify({"message": "Follow-up note added successfully"}), 201

@app.route("/api/admin/analytics/hotspots", methods=["GET"])
def get_hotspots():
    """Returns geographical cluster points for map hotspot visualization."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, village, category, water_source, date_observed, landmark,
                   latitude, longitude, status, priority, is_verified, photo_url
            FROM reports
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            ORDER BY created_at DESC
        """)
        points = [dict(r) for r in cursor.fetchall()]
    return jsonify({"hotspots": points, "count": len(points)}), 200

@app.route("/api/admin/reports/duplicates", methods=["GET"])
@admin_required
def get_duplicate_clusters():
    """Identifies potential duplicate or clustered reports within ~150 meters."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, village, category, date_observed, landmark, latitude, longitude, status, created_at
            FROM reports
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            ORDER BY created_at DESC
        """)
        all_reps = [dict(r) for r in cursor.fetchall()]

    clusters = []
    visited = set()

    for i in range(len(all_reps)):
        r1 = all_reps[i]
        if r1["id"] in visited:
            continue
        cluster = [r1]
        for j in range(i + 1, len(all_reps)):
            r2 = all_reps[j]
            if r2["id"] in visited:
                continue
            dlat = r1["latitude"] - r2["latitude"]
            dlng = r1["longitude"] - r2["longitude"]
            dist_sq = dlat * dlat + dlng * dlng
            if dist_sq < 0.00000225:  # ~150 meters
                cluster.append(r2)
                visited.add(r2["id"])

        if len(cluster) > 1:
            clusters.append({
                "center_lat": sum(c["latitude"] for c in cluster) / len(cluster),
                "center_lng": sum(c["longitude"] for c in cluster) / len(cluster),
                "reports_count": len(cluster),
                "village": cluster[0]["village"],
                "reports": cluster
            })
            for c in cluster:
                visited.add(c["id"])

    return jsonify({"clusters": clusters, "count": len(clusters)}), 200

@app.route("/api/admin/logs", methods=["GET"])
@admin_required
def admin_get_activity_logs():
    """Admin endpoint: retrieves immutable audit activity log."""
    limit = min(100, max(1, int(request.args.get("limit", 50))))
    report_id = request.args.get("report_id", "").strip()

    with get_db() as conn:
        cursor = conn.cursor()
        if report_id:
            cursor.execute("SELECT * FROM admin_activity_logs WHERE report_id = ? ORDER BY timestamp DESC LIMIT ?", (report_id, limit))
        else:
            cursor.execute("SELECT * FROM admin_activity_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()

    logs = [dict(r) for r in rows]
    return jsonify({"logs": logs, "count": len(logs)}), 200

@app.route("/api/admin/reports/<report_id>", methods=["DELETE"])
@role_required(["super_admin", "admin"])
def admin_delete_report(report_id):
    """Admin endpoint: deletes a test or inappropriate report and cleans up any photo file."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT photo_url FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Report not found"}), 404

        # Delete photo if it's on disk
        photo_url = row["photo_url"]
        if photo_url and photo_url.startswith("/uploads/"):
            filename = photo_url.replace("/uploads/", "")
            file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

        cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))

        # Log admin deletion
        admin_user = request.admin
        log_admin_activity(
            cursor,
            admin_user.get("sub"),
            admin_user.get("username"),
            "REPORT_DELETED",
            report_id,
            "Existing",
            "Deleted",
            f"Admin permanently deleted report {report_id} and associated file assets."
        )

    return jsonify({"message": f"Report {report_id} deleted successfully"}), 200

@app.route("/api/admin/export", methods=["GET"])
@admin_required
def admin_export_csv():
    """Admin endpoint: exports all reports to CSV for offline analysis or local authority submission."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM reports ORDER BY created_at DESC")
        rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Report ID", "Village", "District", "State", "Category", "Water Source", "Date Observed",
        "Landmark", "Description", "Latitude", "Longitude", "Priority", "Assigned To",
        "Water Appearance", "Water Smell", "Water Usage", "Issue Duration", "Nearby Wastewater",
        "Suspected Distance", "Reporter Name", "Reporter Contact", "Status", "Is Verified",
        "Lab Name", "Testing Date", "Report Ref No", "Sample Collection Date", "pH", "TDS (mg/L)",
        "Fluoride (mg/L)", "Nitrate (mg/L)", "E. Coli", "Lab Status", "Admin Notes",
        "Created At", "Updated At", "Is Demo"
    ])

    for r in rows:
        writer.writerow([
            r["id"], r["village"], r.get("district") or "", r.get("state") or "",
            r["category"], r["water_source"] or "", r["date_observed"],
            r["landmark"] or "", r["description"],
            r["latitude"] or "", r["longitude"] or "",
            r.get("priority") or "Medium", r.get("assigned_to") or "Unassigned",
            r.get("water_appearance") or "", r.get("water_smell") or "",
            r.get("water_usage") or "", r.get("issue_duration") or "",
            r.get("nearby_wastewater") or "", r.get("suspected_distance") or "",
            r["reporter_name"] or "", r["reporter_contact"] or "", r["status"],
            "Yes" if r["is_verified"] else "No",
            r.get("lab_name") or "", r.get("testing_date") or "",
            r.get("report_reference_no") or "", r.get("sample_collection_date") or "",
            r.get("ph") or "", r.get("tds") or "", r.get("fluoride") or "",
            r.get("nitrate") or "", r.get("e_coli") or "",
            r.get("lab_status") or "Not Tested", r["admin_notes"] or "",
            r["created_at"], r["updated_at"], "Demo" if r["is_demo"] else "Live"
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=jalawatch_reports_export.csv"}
    )

if __name__ == "__main__":
    init_db()
    seed()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    print(f"Starting JalaWatch backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
