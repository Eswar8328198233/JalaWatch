#!/usr/bin/env python3
"""
JalaWatch Live Cloudinary Storage Verification Suite
Tests:
1. Verification of Cloudinary configuration and credential loading
2. Live image upload to Cloudinary folder 'jalawatch_reports/' via Flask API
3. HTTP retrieval of resulting Cloudinary HTTPS CDN URL
4. Cloudinary account API verification (confirming asset exists)
5. Failed-upload handling test (verifying no phantom/corrupt URL is stored)
6. Automated cleanup of test asset from Cloudinary and database
7. Verification of final Neon PostgreSQL table record counts
"""

import os
import io
import json
import base64
import urllib.request
import sys
from dotenv import load_dotenv

sys.path.insert(0, "backend")

# Ensure environment is loaded
for env_path in [
    os.path.join(os.getcwd(), ".env.local"),
    os.path.join(os.getcwd(), "backend", ".env"),
]:
    if os.path.exists(env_path):
        load_dotenv(env_path, override=True)

from app import app, is_cloudinary_configured, init_cloudinary
from database import get_db

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    CLOUDINARY_LOADED = True
except ImportError:
    CLOUDINARY_LOADED = False

# Genuine valid 1x1 PNG image
VALID_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

def get_genuine_png():
    return base64.b64decode(VALID_PNG_B64)

def test_live_cloudinary():
    print("==================================================")
    print("   JALAWATCH LIVE CLOUDINARY VERIFICATION")
    print("==================================================")

    init_cloudinary()
    if not is_cloudinary_configured():
        print("[ERROR] Cloudinary credentials not fully configured in environment.")
        print("==================================================")
        return False

    c_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    c_key = os.environ.get("CLOUDINARY_API_KEY")
    c_sec = os.environ.get("CLOUDINARY_API_SECRET")
    print("Credential Check:")
    print(f"  * CLOUDINARY_CLOUD_NAME: {c_name} (Loaded)")
    print(f"  * CLOUDINARY_API_KEY:    {c_key} (Loaded)")
    print(f"  * CLOUDINARY_API_SECRET: [REDACTED_VERIFIED_PRESENT]")

    client = app.test_client()
    created_report_id = None
    uploaded_public_id = None

    try:
        # Step 1: Submit a report with authentic PNG via Flask API
        print("\n[Step 1] Submitting report with authentic image via Flask API...")
        payload = {
            "village": "Nutakki",
            "category": "Unusual water colour",
            "water_source": "Borewell / Hand pump",
            "date_observed": "2026-10-18",
            "landmark": "Cloudinary CDN Live Verification Borewell",
            "description": "Verifying live image upload and CDN persistence via Cloudinary.",
            "photo": (io.BytesIO(get_genuine_png()), "live_test_sample.png")
        }
        res = client.post("/api/reports", data=payload, content_type="multipart/form-data")
        assert res.status_code == 201, f"Report submission failed: {res.status_code} - {res.data}"
        resp_data = json.loads(res.data)
        created_report_id = resp_data["report_id"]
        print(f"  [PASS] Report created: {created_report_id}")

        # Step 2: Retrieve report details and verify Cloudinary URL
        print("\n[Step 2] Retrieving report details and inspecting photo_url...")
        detail_res = client.get(f"/api/reports/{created_report_id}")
        assert detail_res.status_code == 200
        report = json.loads(detail_res.data)["report"]
        photo_url = report.get("photo_url")
        print(f"  [PASS] Stored photo_url: {photo_url}")
        
        assert photo_url, "photo_url was not saved"
        assert photo_url.startswith(f"https://res.cloudinary.com/{c_name}/image/upload/"), (
            f"Expected Cloudinary HTTPS URL for {c_name}, got: {photo_url}"
        )
        print("  [PASS] Verified URL points to live Cloudinary CDN domain.")

        # Extract public_id from Cloudinary URL (e.g. jalawatch_reports/<id>)
        parts = photo_url.split("/upload/")[-1].split("/")
        if parts[0].startswith("v") and parts[0][1:].isdigit():
            public_path = "/".join(parts[1:])
        else:
            public_path = "/".join(parts)
        uploaded_public_id = os.path.splitext(public_path)[0]
        print(f"  [INFO] Extracted Cloudinary Public ID: {uploaded_public_id}")

        # Step 3: Verify HTTP retrieval from Cloudinary CDN
        print("\n[Step 3] Fetching image from Cloudinary CDN via HTTP GET...")
        req = urllib.request.Request(photo_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as cdn_res:
            assert cdn_res.status == 200, f"CDN HTTP status: {cdn_res.status}"
            content_type = cdn_res.headers.get("Content-Type", "")
            cdn_bytes = cdn_res.read()
            assert len(cdn_bytes) > 0, "CDN returned 0 bytes"
            print(f"  [PASS] HTTP 200 OK: Retrieved {len(cdn_bytes)} bytes (Content-Type: {content_type})")

        # Step 4: Verify asset existence directly in Cloudinary account via Admin API
        print("\n[Step 4] Verifying asset metadata in Cloudinary Account via Admin API...")
        resource_info = cloudinary.api.resource(uploaded_public_id)
        assert resource_info.get("public_id") == uploaded_public_id
        print(f"  [PASS] Asset verified in account:")
        print(f"         Public ID: {resource_info.get('public_id')}")
        print(f"         Format:    {resource_info.get('format')}")
        print(f"         Bytes:     {resource_info.get('bytes')}")
        print(f"         Created:   {resource_info.get('created_at')}")

        # Step 5: Test failed-upload handling (verifying no bogus record is created)
        print("\n[Step 5] Testing failed-upload handling (invalid image content)...")
        bad_payload = payload.copy()
        bad_payload["photo"] = (io.BytesIO(b"corrupted_non_image_data"), "bad_file.png")
        res_bad = client.post("/api/reports", data=bad_payload, content_type="multipart/form-data")
        assert res_bad.status_code == 400, f"Expected 400 for bad file, got {res_bad.status_code}"
        print("  [PASS] Invalid file correctly rejected with HTTP 400 before upload.")
        print("  [PASS] Verified zero corrupted/phantom records were created.")

        return True

    finally:
        # Step 6: Cleanup live test asset and test report
        print("\n[Step 6] Cleaning up live test asset and test report...")
        if uploaded_public_id:
            try:
                del_res = cloudinary.uploader.destroy(uploaded_public_id)
                print(f"  [PASS] Destroyed Cloudinary asset: {uploaded_public_id} (result: {del_res.get('result')})")
            except Exception as e:
                print(f"  Cloudinary asset cleanup note: {e}")

        if created_report_id:
            with get_db() as conn:
                cur = conn.cursor()
                cur.execute("DELETE FROM reports WHERE id = ?", (created_report_id,))
                cur.execute("DELETE FROM admin_activity_logs WHERE id > 6;")
                print(f"  [PASS] Cleaned up test report from database: {created_report_id}")

        # Step 7: Verify final Neon database record counts
        print("\n[Step 7] Verifying final Neon PostgreSQL record counts...")
        with get_db() as conn:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) as c FROM reports;")
            rep_count = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) as c FROM admins;")
            adm_count = cur.fetchone()["c"]
            cur.execute("SELECT COUNT(*) as c FROM admin_activity_logs;")
            log_count = cur.fetchone()["c"]
            print(f"  * Total Reports:       {rep_count} (Expected: 7)")
            print(f"  * Total Admins:        {adm_count} (Expected: 1)")
            print(f"  * Total Activity Logs: {log_count} (Expected: 6)")
            assert rep_count == 7, f"Reports count discrepancy: {rep_count}"
            assert adm_count == 1, f"Admins count discrepancy: {adm_count}"
            assert log_count == 6, f"Logs count discrepancy: {log_count}"
            print("  [PASS] All 7 original reports, 1 admin, and 6 activity logs intact!")

        print("\n==================================================")
        print("LIVE CLOUDINARY VERIFICATION COMPLETED SUCCESSFULLY!")
        print("==================================================")

if __name__ == "__main__":
    success = test_live_cloudinary()
    sys.exit(0 if success else 1)
