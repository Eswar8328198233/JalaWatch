import time
import threading
from functools import wraps
from flask import request, jsonify

class InMemoryRateLimiter:
    """
    Thread-safe, sliding-window in-memory rate limiter.
    Zero external dependencies required (no Redis needed).
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._records = {}  # key -> list of timestamp floats

    def _get_client_ip(self):
        # Support proxies (Render, Cloudflare, Nginx)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.remote_addr or "127.0.0.1"

    def is_allowed(self, key_prefix: str, max_requests: int, window_seconds: int):
        client_ip = self._get_client_ip()
        full_key = f"{key_prefix}:{client_ip}"
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            timestamps = self._records.get(full_key, [])
            # Filter timestamps within current sliding window
            valid_timestamps = [t for t in timestamps if t > window_start]

            if len(valid_timestamps) >= max_requests:
                # Rate limit exceeded
                oldest_in_window = valid_timestamps[0]
                retry_after = max(1, int(oldest_in_window + window_seconds - now))
                self._records[full_key] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._records[full_key] = valid_timestamps
            return True, 0

    def cleanup(self, max_age_seconds: int = 3600):
        """Periodically removes stale keys to avoid unbounded memory growth."""
        now = time.time()
        with self._lock:
            stale_keys = [
                k for k, timestamps in self._records.items()
                if not timestamps or timestamps[-1] < (now - max_age_seconds)
            ]
            for k in stale_keys:
                del self._records[k]

limiter = InMemoryRateLimiter()

def rate_limit(max_requests: int, window_seconds: int, key_prefix: str = "general", custom_message: str = None):
    """Decorator to apply rate limiting to Flask route handlers."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            allowed, retry_after = limiter.is_allowed(key_prefix, max_requests, window_seconds)
            if not allowed:
                msg = custom_message or f"Rate limit exceeded. Too many requests. Please retry in {retry_after} seconds."
                response = jsonify({
                    "error": msg,
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after_seconds": retry_after
                })
                response.status_code = 429
                response.headers["Retry-After"] = str(retry_after)
                return response
            return f(*args, **kwargs)
        return decorated_function
    return decorator

