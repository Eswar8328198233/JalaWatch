import os
import io
import json
import sqlite3
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = "http://localhost:5000"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jalawatch.db")

def http_req(path, method="GET", data=None, headers=None, is_json=True, raw_body=None, content_type=None):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    
    body = None
    if raw_body is not None:
        body = raw_body
        if content_type:
            req.add_header("Content-Type", content_type)
    elif data is not None:
        if is_json:
            body = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        else:
            body = urllib.parse.urlencode(data).encode("utf-8")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    try:
        with urllib.request.urlopen(req, data=body, timeout=10) as resp:
            resp_body = resp.read()
            status = resp.getcode()
            headers_dict = dict(resp.info())
            json_data = None
            try:
                json_data = json.loads(resp_body.decode("utf-8"))
            except Exception:
                pass
            return status, resp_body, json_data, headers_dict
    except urllib.error.HTTPError as e:
        err_body = e.read()
        err_json = None
        try:
            err_json = json.loads(err_body.decode("utf-8"))
        except Exception:
            pass
        return e.code, err_body, err_json, dict(e.headers)

def run_e2e_tests():
    print("=" * 65)
    print("STARTING E2E VERIFICATION SUITE FOR JALAWATCH (ZERO-DEP)")
    print("=" * 65)

    results = {}

    # 1. Verify health endpoint
    print("\n[CHECK 1] Verifying Flask backend health endpoint...")
    try:
        status, _, data, _ = http_req("/api/health")
        assert status == 200, f"Expected 200, got {status}"
        assert data.get("status") == "healthy"
        print(f" -> PASSED: Backend is healthy ({data.get('service')})")
        results["health_check"] = "PASS"
    except Exception as e:
        print(f" -> FAILED: {e}")
        results["health_check"] = f"FAIL: {e}"

    # 2. Submit test report from website format (JSON) and confirm in SQLite
    print("\n[CHECK 2] Submitting test report from Website (JSON) & verifying in SQLite database...")
    web_report_id = None
    try:
        web_payload = {
            "village": "Nutakki",
            "category": "Drainage problems",
            "water_source": "Open Drain / Seepage",
            "date_observed": "2026-10-20",
            "landmark": "Near Gram Panchayat Community Hall",
            "description": "E2E Website Test: Greywater stagnation near unlined lane drainage.",
            "latitude": 16.4390,
            "longitude": 80.6020,
            "reporter_name": "Web Test Volunteer",
            "reporter_contact": "555-0100"
        }
        status, _, res_data, _ = http_req("/api/reports", method="POST", data=web_payload)
        assert status == 201, f"Expected 201, got {status}: {res_data}"
        web_report_id = res_data["report_id"]
        print(f" -> Created Website Report ID: {web_report_id}")

        # Check in SQLite database directly
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM reports WHERE id = ?", (web_report_id,))
        row = cur.fetchone()
        conn.close()

        assert row is not None, f"Report {web_report_id} not found in jalawatch.db"
        assert row["village"] == "Nutakki"
        assert row["category"] == "Drainage problems"
        assert row["reporter_contact"] == "555-0100"
        print(f" -> PASSED: Report {web_report_id} verified directly in SQLite database row!")
        results["website_submission_db_check"] = "PASS"
    except Exception as e:
        print(f" -> FAILED: {e}")
        results["website_submission_db_check"] = f"FAIL: {e}"

    # 3. Submit separate test report from Mobile format (Multipart + Photo) & confirm on Website feed
    print("\n[CHECK 3] Submitting separate test report from Mobile app (Multipart + Photo) & confirming on Web feed...")
    mobile_report_id = None
    try:
        # Build multipart/form-data manually
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        mock_jpg = (
            b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06'
            b'\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14'
            b'\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b'
            b'\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01'
            b'\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00'
            b'\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9'
        )

        parts = []
        fields = {
            "village": "Nutakki",
            "category": "Unusual water colour",
            "water_source": "Borewell",
            "date_observed": "2026-10-20",
            "landmark": "Near Nutakki Field Borewell #3",
            "description": "E2E Mobile Test: Dark sediment observed during morning irrigation cycle.",
            "latitude": "16.4425",
            "longitude": "80.6050",
            "reporter_name": "Mobile Citizen Field Tester",
            "reporter_contact": "555-0199"
        }
        for k, v in fields.items():
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode("utf-8"))
        
        # File part
        file_header = f"--{boundary}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"sample_proof.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n".encode("utf-8")
        parts.append(file_header + mock_jpg + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode("utf-8"))

        multipart_body = b"".join(parts)
        status, _, res_data, _ = http_req(
            "/api/reports",
            method="POST",
            raw_body=multipart_body,
            content_type=f"multipart/form-data; boundary={boundary}"
        )
        assert status == 201, f"Expected 201, got {status}: {res_data}"
        mobile_report_id = res_data["report_id"]
        print(f" -> Created Mobile Report ID: {mobile_report_id}")

        # Now query public GET /api/reports (as the website does)
        status_list, _, list_data, _ = http_req("/api/reports?limit=10")
        assert status_list == 200
        reports = list_data["reports"]
        matching = next((item for item in reports if item["id"] == mobile_report_id), None)
        assert matching is not None, f"Mobile report {mobile_report_id} did not appear in public reports feed!"
        assert matching["village"] == "Nutakki"
        assert matching["category"] == "Unusual water colour"
        assert matching["photo_url"] is not None and "uploads/" in matching["photo_url"]
        assert matching["latitude"] == 16.4425
        assert matching["longitude"] == 80.6050
        print(f" -> PASSED: Mobile report {mobile_report_id} confirmed in website feed with photo {matching['photo_url']}")
        results["mobile_submission_web_sync"] = "PASS"
    except Exception as e:
        print(f" -> FAILED: {e}")
        results["mobile_submission_web_sync"] = f"FAIL: {e}"

    # 4. Verify Image Upload Serving and Invalid File Type Handling
    print("\n[CHECK 4] Verifying uploaded image retrieval & invalid file rejection...")
    try:
        # Check image serving
        if mobile_report_id:
            _, _, r_detail, _ = http_req(f"/api/reports/{mobile_report_id}")
            photo_url = r_detail["report"]["photo_url"]
            img_status, img_bytes, _, img_headers = http_req(photo_url)
            assert img_status == 200, f"Expected 200, got {img_status}"
            assert "image" in str(img_headers).lower(), "Expected image content type"
            print(f" -> PASSED: Image retrieval verified ({len(img_bytes)} bytes served)")

        # Test invalid file rejection (e.g. .exe file)
        boundary_bad = "----WebKitFormBoundaryBadFileTest"
        bad_parts = [
            f"--{boundary_bad}\r\nContent-Disposition: form-data; name=\"village\"\r\n\r\nNutakki\r\n".encode("utf-8"),
            f"--{boundary_bad}\r\nContent-Disposition: form-data; name=\"category\"\r\n\r\nOther\r\n".encode("utf-8"),
            f"--{boundary_bad}\r\nContent-Disposition: form-data; name=\"date_observed\"\r\n\r\n2026-10-20\r\n".encode("utf-8"),
            f"--{boundary_bad}\r\nContent-Disposition: form-data; name=\"description\"\r\n\r\nTesting bad file upload\r\n".encode("utf-8"),
            f"--{boundary_bad}\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"malicious.exe\"\r\nContent-Type: application/octet-stream\r\n\r\nMZtest\r\n".encode("utf-8"),
            f"--{boundary_bad}--\r\n".encode("utf-8")
        ]
        bad_body = b"".join(bad_parts)
        bad_status, bad_res, bad_json, _ = http_req(
            "/api/reports",
            method="POST",
            raw_body=bad_body,
            content_type=f"multipart/form-data; boundary={boundary_bad}"
        )
        assert bad_status == 400, f"Expected 400 for bad extension, got {bad_status}"
        print(" -> PASSED: Disallowed file extension (.exe) rejected with HTTP 400")
        results["image_upload_and_security"] = "PASS"
    except Exception as e:
        print(f" -> FAILED: {e}")
        results["image_upload_and_security"] = f"FAIL: {e}"

    # 5. Verify Filters, Map Queries, and Empty States
    print("\n[CHECK 5] Verifying category filters, map marker queries, and empty states...")
    try:
        # Filter by category
        s_cat, _, d_cat, _ = http_req("/api/reports?category=Unusual+water+colour")
        assert s_cat == 200
        cat_reports = d_cat["reports"]
        for rep in cat_reports:
            assert rep["category"] == "Unusual water colour"
        print(f" -> PASSED: Category filter returned {len(cat_reports)} matching reports")

        # Filter by village
        s_vil, _, d_vil, _ = http_req("/api/reports?village=Nutakki")
        assert s_vil == 200
        vil_reports = d_vil["reports"]
        for rep in vil_reports:
            assert rep["village"] == "Nutakki"
        print(f" -> PASSED: Village filter returned {len(vil_reports)} matching reports")

        # Empty state query
        s_empty, _, d_empty, _ = http_req("/api/reports?category=NonExistentIssueXYZ")
        assert s_empty == 200
        assert d_empty["reports"] == []
        assert d_empty["pagination"]["total_records"] == 0
        print(" -> PASSED: Empty state query returned empty array [] with 0 records")

        # Single report detail
        if web_report_id:
            s_single, _, d_single, _ = http_req(f"/api/reports/{web_report_id}")
            assert s_single == 200
            single_data = d_single["report"]
            assert single_data["id"] == web_report_id
            print(f" -> PASSED: GET /api/reports/{web_report_id} retrieved valid report object")

        results["filters_and_empty_states"] = "PASS"
    except Exception as e:
        print(f" -> FAILED: {e}")
        results["filters_and_empty_states"] = f"FAIL: {e}"

    # 6. Verify Administrator Authentication, Status Updates, CSV Export, and Private Data Protection
    print("\n[CHECK 6] Verifying admin authentication, status updates, CSV export, and private data protection...")
    try:
        # Invalid admin login
        s_bad, _, _, _ = http_req("/api/auth/login", method="POST", data={"username": "admin", "password": "WrongPassword!"})
        assert s_bad == 401, f"Expected 401, got {s_bad}"
        print(" -> PASSED: Unauthorized admin login correctly rejected with HTTP 401")

        # Valid admin login
        s_login, _, d_login, _ = http_req("/api/auth/login", method="POST", data={"username": "admin", "password": "JalaWatchAdmin@2026"})
        assert s_login == 200, f"Expected 200, got {s_login}"
        token = d_login["token"]
        assert token, "Token missing in response"
        print(" -> PASSED: Admin authenticated and JWT token generated")

        headers = {"Authorization": f"Bearer {token}"}

        # Update status of mobile report
        if mobile_report_id:
            update_payload = {
                "status": "Under Review",
                "admin_notes": "Official CSP field team deployed to inspect borewell depth."
            }
            s_up, _, _, _ = http_req(f"/api/admin/reports/{mobile_report_id}/status", method="PUT", data=update_payload, headers=headers)
            assert s_up == 200, f"Expected 200, got {s_up}"
            print(f" -> PASSED: Updated {mobile_report_id} status to 'Under Review' with private admin notes")

            # Check Private Data Protection: Public API must NOT return admin_notes or reporter_contact
            s_pub, _, d_pub, _ = http_req(f"/api/reports/{mobile_report_id}")
            assert s_pub == 200
            pub_data = d_pub["report"]
            assert "admin_notes" not in pub_data, "SECURITY VIOLATION: admin_notes leaked to public!"
            assert "reporter_contact" not in pub_data, "SECURITY VIOLATION: reporter_contact leaked to public!"
            assert pub_data["status"] == "Under Review", "Public status did not reflect update!"
            print(" -> PASSED: Security verified! Public API hides admin_notes and reporter_contact")

            # Admin API DOES return admin_notes and reporter_contact
            s_adm, _, d_adm, _ = http_req("/api/admin/reports", headers=headers)
            assert s_adm == 200
            admin_reps = d_adm["reports"]
            matching_admin = next((item for item in admin_reps if item["id"] == mobile_report_id), None)
            assert matching_admin is not None
            assert matching_admin["admin_notes"] == "Official CSP field team deployed to inspect borewell depth."
            assert matching_admin["reporter_contact"] == "555-0199"
            print(" -> PASSED: Admin API correctly returns private admin_notes and reporter_contact for staff")

        # CSV Export
        s_csv, b_csv, _, h_csv = http_req("/api/admin/export", headers=headers)
        assert s_csv == 200, f"Expected 200, got {s_csv}"
        csv_text = b_csv.decode("utf-8")
        assert "Report ID" in csv_text
        assert "Village" in csv_text
        print(" -> PASSED: Admin CSV export generated with HTTP 200 and valid CSV header columns")

        results["admin_and_security"] = "PASS"
    except Exception as e:
        print(f" -> FAILED: {e}")
        results["admin_and_security"] = f"FAIL: {e}"

    # Clean up test reports
    print("\n[CLEANUP] Removing test records from database...")
    try:
        _, _, d_login, _ = http_req("/api/auth/login", method="POST", data={"username": "admin", "password": "JalaWatchAdmin@2026"})
        headers = {"Authorization": f"Bearer {d_login['token']}"}
        if web_report_id:
            http_req(f"/api/admin/reports/{web_report_id}", method="DELETE", headers=headers)
        if mobile_report_id:
            http_req(f"/api/admin/reports/{mobile_report_id}", method="DELETE", headers=headers)
        print(" -> PASSED: Cleaned up test records cleanly")
    except Exception as e:
        print(f" -> Warning during cleanup: {e}")

    print("\n" + "=" * 65)
    print("FINAL SUMMARY OF CHECKS:")
    for k, v in results.items():
        print(f" - {k}: {v}")
    print("=" * 65)

if __name__ == "__main__":
    run_e2e_tests()
