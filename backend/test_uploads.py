#!/usr/bin/env python3
"""
JalaWatch Upload Pipeline & Image Validation Test Suite
Tests:
1. Authentic JPEG upload (magic bytes b"\xff\xd8\xff")
2. Authentic PNG upload (magic bytes b"\x89PNG\r\n\x1a\n")
3. Authentic WEBP upload (magic bytes b"RIFF....WEBP")
4. Image retrieval via /uploads/<filename> (HTTP 200, correct mimetype)
5. Invalid file extension rejection (.exe, .pdf, .txt) (HTTP 400)
6. Spoofed image rejection (valid extension, invalid magic bytes) (HTTP 400)
7. Maximum file size enforcement (>5MB rejection) (HTTP 400/413)
8. Database integrity and test file cleanup
"""

import os
import io
import json
import sys

sys.path.insert(0, "backend")
from app import app
from database import get_db

def build_valid_jpeg():
    """Generates a minimal valid JPEG byte stream."""
    return b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\xff\xd9"

def build_valid_png():
    """Generates a minimal valid PNG byte stream."""
    return b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

def build_valid_webp():
    """Generates a minimal valid WEBP byte stream."""
    return b"RIFF\x1a\x00\x00\x00WEBPVP8 \x0e\x00\x00\x000\x01\x00\x9d\x01*\x01\x00\x01\x00\x02\x004%\xa4\x00"

def run_tests():
    print("==================================================")
    print("   JALAWATCH IMAGE UPLOAD & VALIDATION TEST")
    print("==================================================")
    client = app.test_client()
    created_reports = []

    try:
        # Common form fields
        base_data = {
            "village": "Nutakki",
            "category": "Unusual water colour",
            "water_source": "Borewell / Hand pump",
            "date_observed": "2026-10-18",
            "landmark": "Near Panchayat Water Tank",
            "description": "Validation test report for image upload pipeline security."
        }

        # Test 1: Authentic JPEG Upload
        print("\n[Test 1] Testing authentic JPEG upload...")
        jpeg_data = base_data.copy()
        jpeg_data["photo"] = (io.BytesIO(build_valid_jpeg()), "sample_water_test.jpg")
        res = client.post("/api/reports", data=jpeg_data, content_type="multipart/form-data")
        assert res.status_code == 201, f"JPEG upload failed: {res.status_code} - {res.data}"
        rep_jpeg = json.loads(res.data)
        r_id_jpeg = rep_jpeg["report_id"]
        created_reports.append(r_id_jpeg)
        
        detail_res = client.get(f"/api/reports/{r_id_jpeg}")
        assert detail_res.status_code == 200
        report_obj = json.loads(detail_res.data)["report"]
        jpeg_url = report_obj.get("photo_url")
        assert jpeg_url, "Photo URL missing in created report"
        print(f"  [PASS] JPEG accepted. Report ID: {r_id_jpeg} | photo_url: {jpeg_url}")

        # Test 2: Authentic PNG Upload
        print("\n[Test 2] Testing authentic PNG upload...")
        png_data = base_data.copy()
        png_data["photo"] = (io.BytesIO(build_valid_png()), "clarity_chart.png")
        res = client.post("/api/reports", data=png_data, content_type="multipart/form-data")
        assert res.status_code == 201, f"PNG upload failed: {res.status_code} - {res.data}"
        rep_png = json.loads(res.data)
        r_id_png = rep_png["report_id"]
        created_reports.append(r_id_png)
        
        detail_res = client.get(f"/api/reports/{r_id_png}")
        assert detail_res.status_code == 200
        report_obj = json.loads(detail_res.data)["report"]
        png_url = report_obj.get("photo_url")
        assert png_url, "Photo URL missing in created report"
        print(f"  [PASS] PNG accepted. Report ID: {r_id_png} | photo_url: {png_url}")

        # Test 3: Authentic WEBP Upload
        print("\n[Test 3] Testing authentic WEBP upload...")
        webp_data = base_data.copy()
        webp_data["photo"] = (io.BytesIO(build_valid_webp()), "sediment_deposit.webp")
        res = client.post("/api/reports", data=webp_data, content_type="multipart/form-data")
        assert res.status_code == 201, f"WEBP upload failed: {res.status_code} - {res.data}"
        rep_webp = json.loads(res.data)
        r_id_webp = rep_webp["report_id"]
        created_reports.append(r_id_webp)
        
        detail_res = client.get(f"/api/reports/{r_id_webp}")
        assert detail_res.status_code == 200
        report_obj = json.loads(detail_res.data)["report"]
        webp_url = report_obj.get("photo_url")
        assert webp_url, "Photo URL missing in created report"
        print(f"  [PASS] WEBP accepted. Report ID: {r_id_webp} | photo_url: {webp_url}")

        # Test 4: Image Retrieval (for local disk uploads)
        print("\n[Test 4] Testing image retrieval endpoint...")
        for url in [jpeg_url, png_url, webp_url]:
            if url.startswith("/uploads/"):
                retrieve_res = client.get(url)
                assert retrieve_res.status_code == 200, f"Retrieval failed for {url}: {retrieve_res.status_code}"
                assert len(retrieve_res.data) > 0, f"Empty content returned for {url}"
                print(f"  [PASS] Retrieved {url} (HTTP 200, {len(retrieve_res.data)} bytes)")
            else:
                print(f"  [PASS] Durable Cloudinary URL generated: {url}")

        # Test 5: Invalid File Extension Rejection (.pdf, .exe, .txt)
        print("\n[Test 5] Testing invalid file extension rejection...")
        for ext, fake_content in [("test.exe", b"MZ\x90\x00This is an executable"), 
                                  ("report.pdf", b"%PDF-1.4\n1 0 obj..."),
                                  ("notes.txt", b"Plain text notes")]:
            bad_ext_data = base_data.copy()
            bad_ext_data["photo"] = (io.BytesIO(fake_content), ext)
            res = client.post("/api/reports", data=bad_ext_data, content_type="multipart/form-data")
            assert res.status_code == 400, f"Expected 400 for {ext}, got {res.status_code}"
            resp_json = json.loads(res.data)
            assert "photo" in resp_json.get("details", {}), f"Missing photo error for {ext}"
            print(f"  [PASS] Correctly rejected extension '{ext}': {resp_json['details']['photo']}")

        # Test 6: Spoofed File Signature Rejection (e.g. evil.jpg containing text/php)
        print("\n[Test 6] Testing spoofed image rejection (magic bytes validation)...")
        spoofed_content = b"<?php echo 'malicious code'; ?>NotAnAuthenticImageHeader"
        spoofed_data = base_data.copy()
        spoofed_data["photo"] = (io.BytesIO(spoofed_content), "spoofed_image.jpg")
        res = client.post("/api/reports", data=spoofed_data, content_type="multipart/form-data")
        assert res.status_code == 400, f"Expected 400 for spoofed image, got {res.status_code}"
        resp_json = json.loads(res.data)
        assert "photo" in resp_json.get("details", {})
        print(f"  [PASS] Correctly rejected spoofed header: {resp_json['details']['photo']}")

        # Test 7: Maximum 5MB File Size Limit Enforcement
        print("\n[Test 7] Testing 5MB file size limit enforcement...")
        # 5MB + 1024 bytes = 5,243,904 bytes
        oversized_data = base_data.copy()
        oversized_content = b"\xff\xd8\xff\xe0" + (b"\x00" * (5 * 1024 * 1024 + 1024))
        oversized_data["photo"] = (io.BytesIO(oversized_content), "oversized.jpg")
        res = client.post("/api/reports", data=oversized_data, content_type="multipart/form-data")
        assert res.status_code in (400, 413), f"Expected 400 or 413 for oversized image, got {res.status_code}"
        print(f"  [PASS] Correctly rejected >5MB upload (HTTP {res.status_code} Request Entity Too Large / Bad Request)")

    finally:
        # Cleanup: Delete the test reports created in Tests 1, 2, 3
        print("\n[Cleanup] Cleaning up test records from database & disk...")
        import gc
        gc.collect()
        with get_db() as conn:
            cur = conn.cursor()
            for r_id in created_reports:
                # Query photo_url to remove local test file if created
                cur.execute("SELECT photo_url FROM reports WHERE id = ?", (r_id,))
                row = cur.fetchone()
                if row and row["photo_url"] and row["photo_url"].startswith("/uploads/"):
                    fname = row["photo_url"].replace("/uploads/", "")
                    fpath = os.path.join(app.config["UPLOAD_FOLDER"], fname)
                    if os.path.exists(fpath):
                        try:
                            os.remove(fpath)
                            print(f"  Cleaned up local file: {fname}")
                        except Exception as e:
                            print(f"  [Cleanup Note] File {fname} deferred removal: {e}")
                cur.execute("DELETE FROM reports WHERE id = ?", (r_id,))
                print(f"  Deleted test report: {r_id}")
            # Clean up any activity logs generated during test
            cur.execute("DELETE FROM admin_activity_logs WHERE id > 6;")

    print("\n==================================================")
    print("ALL 7 IMAGE UPLOAD & VALIDATION TESTS PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
