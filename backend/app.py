import os
import re
import uuid
import datetime
import csv
import io
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import get_db, init_db
from auth import (
    hash_password,
    verify_password,
    generate_jwt_token,
    admin_required
)
from seed_data import seed

app = Flask(__name__)
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
        "total_reports": report_count,
        "service": "JalaWatch Groundwater Pollution Reporting API",
        "version": "1.0.0",
        "project": "Community Service Project (CSP) - Nutakki Village Study",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), status_code

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

        cursor.execute("SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY count DESC")
        category_breakdown = [{"category": row["category"], "count": row["count"]} for row in cursor.fetchall()]

        cursor.execute("SELECT village, COUNT(*) as count FROM reports GROUP BY village ORDER BY count DESC LIMIT 5")
        top_villages = [{"village": row["village"], "count": row["count"]} for row in cursor.fetchall()]

    return jsonify({
        "total_reports": total,
        "submitted": submitted,
        "under_review": under_review,
        "resolved": resolved,
        "villages_impacted": villages_count,
        "category_breakdown": category_breakdown,
        "top_villages": top_villages
    }), 200

@app.route("/api/reports", methods=["GET"])
def get_reports():
    """Retrieves paginated and filtered community reports for public viewing."""
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    village = request.args.get("village", "").strip()
    status = request.args.get("status", "").strip()
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
            # Check length/size safely
            file.seek(0, os.SEEK_END)
            size = file.tell()
            file.seek(0)
            if size > MAX_CONTENT_LENGTH:
                errors["photo"] = "Photo size exceeds the maximum limit of 5MB."
            else:
                ext = file.filename.rsplit(".", 1)[1].lower()
                clean_filename = f"{uuid.uuid4().hex}.{ext}"
                save_path = os.path.join(app.config["UPLOAD_FOLDER"], clean_filename)
                file.save(save_path)
                photo_url = f"/uploads/{clean_filename}"

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    report_id = generate_report_id()
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO reports (
                id, village, category, water_source, date_observed, landmark,
                description, photo_url, latitude, longitude, reporter_name,
                reporter_contact, status, is_verified, admin_notes,
                created_at, updated_at, is_demo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 0, NULL, ?, ?, 0)
        """, (
            report_id, village, category, water_source, date_observed, landmark,
            description, photo_url, latitude, longitude, reporter_name,
            reporter_contact, now_str, now_str
        ))

    return jsonify({
        "message": "Report submitted successfully. Thank you for contributing to groundwater awareness.",
        "report_id": report_id,
        "status": "Submitted",
        "is_verified": False,
        "disclaimer": "This report is an unverified civic observation. Qualified laboratory water testing is recommended before confirming safety."
    }), 201

# ----------------- ADMIN AUTH & MANAGEMENT ----------------- #

@app.route("/api/auth/login", methods=["POST"])
def admin_login():
    """Authenticates administrator and returns a JWT token."""
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM admins WHERE username = ? OR email = ?", (username, username))
        admin = cursor.fetchone()

        if not admin or not verify_password(password, admin["password_hash"]):
            return jsonify({"error": "Invalid username or password"}), 401

        # Update last login
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("UPDATE admins SET last_login = ? WHERE id = ?", (now_str, admin["id"]))

    token = generate_jwt_token(admin["id"], admin["username"], admin["email"])

    return jsonify({
        "message": "Login successful",
        "token": token,
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "email": admin["email"],
            "role": admin["role"]
        }
    }), 200

@app.route("/api/auth/me", methods=["GET"])
@admin_required
def get_current_admin():
    """Validates token and returns current admin context."""
    admin_info = request.admin
    return jsonify({
        "admin": {
            "id": admin_info.get("sub"),
            "username": admin_info.get("username"),
            "email": admin_info.get("email")
        }
    }), 200

@app.route("/api/admin/reports", methods=["GET"])
@admin_required
def admin_get_reports():
    """Admin endpoint: lists all reports including private admin notes and reporter contact."""
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()

    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if search:
        query += " AND (id LIKE ? OR village LIKE ? OR landmark LIKE ? OR description LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern])

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    if category and category != "All":
        query += " AND category = ?"
        params.append(category)

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

        cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        updated_row = cursor.fetchone()

    return jsonify({
        "message": "Report status updated successfully",
        "report": format_report_admin(updated_row)
    }), 200

@app.route("/api/admin/reports/<report_id>", methods=["DELETE"])
@admin_required
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
        "Report ID", "Village", "Category", "Water Source", "Date Observed",
        "Landmark", "Description", "Latitude", "Longitude", "Reporter Name",
        "Reporter Contact", "Status", "Is Verified", "Admin Notes", "Created At", "Updated At", "Is Demo"
    ])

    for r in rows:
        writer.writerow([
            r["id"], r["village"], r["category"], r["water_source"] or "",
            r["date_observed"], r["landmark"] or "", r["description"],
            r["latitude"] or "", r["longitude"] or "", r["reporter_name"] or "",
            r["reporter_contact"] or "", r["status"],
            "Yes" if r["is_verified"] else "No", r["admin_notes"] or "",
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
