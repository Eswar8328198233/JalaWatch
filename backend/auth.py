import jwt
import os
import secrets
import datetime
from functools import wraps
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

def get_secret_key() -> str:
    """
    Returns the application SECRET_KEY.
    In production (e.g. Render/Railway), if SECRET_KEY is missing or remains the default placeholder,
    logs a prominent security alert and uses a cryptographically generated 256-bit key to prevent token forgery.
    """
    key = os.environ.get("SECRET_KEY")
    is_prod = os.environ.get("FLASK_ENV") == "production" or os.environ.get("RENDER") is not None

    if not key or key == "jalawatch_secret_key_change_in_production_csp_2026":
        if is_prod:
            print("[SECURITY WARNING] Insecure or missing SECRET_KEY in production! Generating secure 256-bit ephemeral key.")
            # Cache ephemeral key in environment for server lifecycle
            key = secrets.token_hex(32)
            os.environ["SECRET_KEY"] = key
        else:
            key = key or "jalawatch_dev_secret_key_local_only"
    return key

SECRET_KEY = get_secret_key()
JWT_EXPIRATION_HOURS = 24

def hash_password(password: str) -> str:
    """Hashes a plain password using PBKDF2/SHA256."""
    return generate_password_hash(password, method="pbkdf2:sha256", salt_length=16)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored hash."""
    return check_password_hash(hashed_password, plain_password)

def generate_jwt_token(admin_id: int, username: str, email: str, role: str = "admin") -> str:
    """Generates a secure JWT token valid for 24 hours."""
    payload = {
        "sub": str(admin_id),
        "username": username,
        "email": email,
        "role": role,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_jwt_token(token: str):
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def admin_required(f):
    """Decorator to protect administrative endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        token = None

        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
            else:
                return jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'", "code": "INVALID_TOKEN_FORMAT"}), 401
        
        # Fallback to query parameter (e.g. for browser file downloads like /api/admin/export?token=...)
        if not token:
            token = request.args.get("token", None)

        if not token:
            return jsonify({"error": "Authorization token required", "code": "UNAUTHORIZED"}), 401

        decoded = decode_jwt_token(token)
        if not decoded:
            return jsonify({"error": "Invalid or expired authorization token", "code": "TOKEN_EXPIRED_OR_INVALID"}), 401

        request.admin = decoded
        return f(*args, **kwargs)
    return decorated_function

def role_required(allowed_roles):
    """Decorator to require specific admin roles (e.g. ['super_admin', 'admin'])."""
    def decorator(f):
        @wraps(f)
        @admin_required
        def decorated_function(*args, **kwargs):
            admin_role = request.admin.get("role", "admin")
            if admin_role not in allowed_roles:
                return jsonify({
                    "error": f"Access denied. Required role: {', '.join(allowed_roles)}. Your role is '{admin_role}'.",
                    "code": "FORBIDDEN"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
