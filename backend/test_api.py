import json
from app import app
from database import init_db

def test_endpoints():
    print("Testing backend endpoints via Flask test client...")
    client = app.test_client()

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print("[PASS] GET /api/health passed")

    # 2. Stats
    res = client.get("/api/stats")
    assert res.status_code == 200, f"Stats failed: {res.data}"
    stats = json.loads(res.data)
    assert stats["total_reports"] >= 6
    print(f"[PASS] GET /api/stats passed ({stats['total_reports']} reports)")

    # 3. Public reports
    res = client.get("/api/reports?limit=10")
    assert res.status_code == 200, f"Reports failed: {res.data}"
    data = json.loads(res.data)
    assert len(data["reports"]) > 0
    # verify admin_notes is hidden from public API
    first_report = data["reports"][0]
    assert "admin_notes" not in first_report, "Security issue: admin_notes exposed in public reports!"
    assert "reporter_contact" not in first_report, "Security issue: reporter_contact exposed in public reports!"
    print("[PASS] GET /api/reports passed (Public security check verified: private fields hidden)")

    # 4. Report Submission
    new_report_payload = {
        "village": "Nutakki",
        "category": "Unusual water colour",
        "water_source": "Borewell / Hand pump",
        "date_observed": "2026-10-18",
        "landmark": "Near Panchayat Water Tank",
        "description": "Noticeable cloudy greyish tint in the drinking water borewell during midday pumping.",
        "latitude": 16.4385,
        "longitude": 80.6015,
        "reporter_name": "Test Citizen"
    }
    res = client.post("/api/reports", json=new_report_payload)
    assert res.status_code == 201, f"Report submission failed: {res.data}"
    submit_resp = json.loads(res.data)
    new_id = submit_resp["report_id"]
    print(f"[PASS] POST /api/reports passed (Created {new_id})")

    # 5. Admin Login
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "JalaWatchAdmin@2026"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.data}"
    login_data = json.loads(login_res.data)
    token = login_data["token"]
    assert token, "No token returned"
    print("[PASS] POST /api/auth/login passed (Token generated)")

    # 6. Admin Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200, f"Admin me failed: {me_res.data}"
    print("[PASS] GET /api/auth/me passed")

    # 7. Admin update status
    update_res = client.put(f"/api/admin/reports/{new_id}/status", 
                            headers={"Authorization": f"Bearer {token}"},
                            json={"status": "Under Review", "admin_notes": "Assigned to village inspection team."})
    assert update_res.status_code == 200, f"Admin update failed: {update_res.data}"
    print(f"[PASS] PUT /api/admin/reports/{new_id}/status passed")

    # 8. Admin export
    export_res = client.get("/api/admin/export", headers={"Authorization": f"Bearer {token}"})
    assert export_res.status_code == 200, f"Admin export failed: {export_res.data}"
    assert b"Report ID" in export_res.data
    print("[PASS] GET /api/admin/export passed (CSV generated)")

    # 9. Clean up test report
    del_res = client.delete(f"/api/admin/reports/{new_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200, f"Admin delete failed: {del_res.data}"
    print(f"[PASS] DELETE /api/admin/reports/{new_id} passed")

    print("\nALL BACKEND UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
