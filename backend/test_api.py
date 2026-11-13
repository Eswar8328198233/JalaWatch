import os
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

    # 2. Reverse Geocoding
    geo_res = client.get("/api/geocode/reverse?lat=16.4382&lng=80.6010")
    assert geo_res.status_code == 200, f"Geocode failed: {geo_res.data}"
    geo_data = json.loads(geo_res.data)
    assert "address" in geo_data
    print(f"[PASS] GET /api/geocode/reverse passed (Resolved: {geo_data['address'].get('display_name', '')[:60]}...)")

    # 3. Stats
    res = client.get("/api/stats")
    assert res.status_code == 200, f"Stats failed: {res.data}"
    stats = json.loads(res.data)
    assert stats["total_reports"] >= 6
    assert "priority_breakdown" in stats
    print(f"[PASS] GET /api/stats passed ({stats['total_reports']} reports, priority metrics included)")

    # 4. Public reports
    res = client.get("/api/reports?limit=10")
    assert res.status_code == 200, f"Reports failed: {res.data}"
    data = json.loads(res.data)
    assert len(data["reports"]) > 0
    # verify admin_notes is hidden from public API
    first_report = data["reports"][0]
    assert "admin_notes" not in first_report, "Security issue: admin_notes exposed in public reports!"
    assert "reporter_contact" not in first_report, "Security issue: reporter_contact exposed in public reports!"
    print("[PASS] GET /api/reports passed (Public security check verified: private fields hidden)")

    # 5. Report Submission with extended survey & location fields
    new_report_payload = {
        "village": "Nutakki",
        "district": "Guntur District",
        "state": "Andhra Pradesh",
        "category": "Unusual water colour",
        "water_source": "Borewell / Hand pump",
        "date_observed": "2026-10-18",
        "landmark": "Near Panchayat Water Tank",
        "description": "Noticeable cloudy greyish tint in the drinking water borewell during midday pumping.",
        "latitude": 16.4385,
        "longitude": 80.6015,
        "reporter_name": "Test Citizen",
        "water_appearance": "Turbid / Cloudy",
        "water_smell": "None",
        "water_usage": "Drinking",
        "issue_duration": "Few days",
        "nearby_wastewater": "Open drain",
        "suspected_distance": "5-15 meters",
        "priority": "High"
    }
    res = client.post("/api/reports", json=new_report_payload)
    assert res.status_code == 201, f"Report submission failed: {res.data}"
    submit_resp = json.loads(res.data)
    new_id = submit_resp["report_id"]
    assert submit_resp["priority"] == "High"
    print(f"[PASS] POST /api/reports passed (Created {new_id} with extended survey fields)")

    # 6. Admin Login (reads configured rotated password from .env.admin_password or environment)
    admin_password = None
    pwd_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env.admin_password")
    if os.path.exists(pwd_file):
        with open(pwd_file, "r", encoding="utf-8") as f:
            raw = f.read().strip()
            if raw:
                admin_password = raw.split("=", 1)[1] if "=" in raw else raw
    if not admin_password:
        admin_password = os.environ.get("ADMIN_PASSWORD", "JalaWatchAdmin@2026")

    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": admin_password
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.data}"
    login_data = json.loads(login_res.data)
    token = login_data["token"]
    assert token, "No token returned"
    assert login_data["admin"]["role"] in ["super_admin", "admin"]
    print(f"[PASS] POST /api/auth/login passed (Token generated, Role: {login_data['admin']['role']})")

    # 7. Admin Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200, f"Admin me failed: {me_res.data}"
    me_data = json.loads(me_res.data)
    assert "role" in me_data["admin"]
    print(f"[PASS] GET /api/auth/me passed (Role: {me_data['admin']['role']})")

    # 8. Admin update status
    update_res = client.put(f"/api/admin/reports/{new_id}/status", 
                            headers={"Authorization": f"Bearer {token}"},
                            json={"status": "Under Review", "admin_notes": "Assigned to village inspection team."})
    assert update_res.status_code == 200, f"Admin update failed: {update_res.data}"
    print(f"[PASS] PUT /api/admin/reports/{new_id}/status passed")

    # 9. Admin update priority
    prio_res = client.put(f"/api/admin/reports/{new_id}/priority",
                          headers={"Authorization": f"Bearer {token}"},
                          json={"priority": "Urgent"})
    assert prio_res.status_code == 200, f"Priority update failed: {prio_res.data}"
    prio_data = json.loads(prio_res.data)
    assert prio_data["report"]["priority"] == "Urgent"
    print(f"[PASS] PUT /api/admin/reports/{new_id}/priority passed (Set to Urgent)")

    # 10. Admin assign report
    assign_res = client.put(f"/api/admin/reports/{new_id}/assign",
                            headers={"Authorization": f"Bearer {token}"},
                            json={"assigned_to": "Field Inspector Rao"})
    assert assign_res.status_code == 200, f"Assign failed: {assign_res.data}"
    assign_data = json.loads(assign_res.data)
    assert assign_data["report"]["assigned_to"] == "Field Inspector Rao"
    print(f"[PASS] PUT /api/admin/reports/{new_id}/assign passed")

    # 11. Admin add follow-up note
    note_res = client.post(f"/api/admin/reports/{new_id}/notes",
                           headers={"Authorization": f"Bearer {token}"},
                           json={"note": "Collected 1-liter sample from borewell head at 11:30 AM."})
    assert note_res.status_code == 201, f"Note add failed: {note_res.data}"
    
    # 12. Admin get follow-up notes
    notes_get_res = client.get(f"/api/admin/reports/{new_id}/notes",
                               headers={"Authorization": f"Bearer {token}"})
    assert notes_get_res.status_code == 200
    notes_data = json.loads(notes_get_res.data)
    assert len(notes_data["notes"]) >= 1
    print(f"[PASS] Follow-up Notes API passed ({len(notes_data['notes'])} note recorded)")

    # 13. Admin record lab test results
    lab_res = client.put(f"/api/admin/reports/{new_id}/lab-test",
                         headers={"Authorization": f"Bearer {token}"},
                         json={
                             "ph": 7.2,
                             "tds": 420.0,
                             "fluoride": 0.8,
                             "nitrate": 15.0,
                             "e_coli": "Absent (Safe)",
                             "lab_name": "RWS&S District Water Quality Lab, Guntur",
                             "testing_date": "2026-10-20",
                             "report_reference_no": "RWS-GNT-2026-904",
                             "sample_collection_date": "2026-10-19",
                             "lab_status": "Tested & Certified",
                             "is_verified": True
                         })
    assert lab_res.status_code == 200, f"Lab test recording failed: {lab_res.data}"
    lab_data = json.loads(lab_res.data)
    assert lab_data["report"]["ph"] == 7.2
    assert lab_data["report"]["tds"] == 420.0
    assert lab_data["report"]["report_reference_no"] == "RWS-GNT-2026-904"
    print(f"[PASS] PUT /api/admin/reports/{new_id}/lab-test passed")

    # 14. Admin list users
    users_res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert users_res.status_code == 200, f"List users failed: {users_res.data}"
    users_data = json.loads(users_res.data)
    assert len(users_data["users"]) >= 1
    print(f"[PASS] GET /api/admin/users passed ({len(users_data['users'])} admin/officers)")

    # 15. Hotspots & duplicate detection
    hotspot_res = client.get("/api/admin/analytics/hotspots")
    assert hotspot_res.status_code == 200
    print(f"[PASS] GET /api/admin/analytics/hotspots passed")

    dup_res = client.get("/api/admin/reports/duplicates", headers={"Authorization": f"Bearer {token}"})
    assert dup_res.status_code == 200
    print(f"[PASS] GET /api/admin/reports/duplicates passed")

    # 16. Admin get activity logs
    logs_res = client.get("/api/admin/logs", headers={"Authorization": f"Bearer {token}"})
    assert logs_res.status_code == 200, f"Get activity logs failed: {logs_res.data}"
    logs_data = json.loads(logs_res.data)
    assert len(logs_data["logs"]) >= 2
    print(f"[PASS] GET /api/admin/logs passed ({len(logs_data['logs'])} activity logs recorded)")

    # 17. Admin export
    export_res = client.get("/api/admin/export", headers={"Authorization": f"Bearer {token}"})
    assert export_res.status_code == 200, f"Admin export failed: {export_res.data}"
    assert b"Report ID" in export_res.data
    assert b"Priority" in export_res.data
    assert b"District" in export_res.data
    print("[PASS] GET /api/admin/export passed (Comprehensive CSV generated)")

    # 18. Clean up test report
    del_res = client.delete(f"/api/admin/reports/{new_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200, f"Admin delete failed: {del_res.data}"
    print(f"[PASS] DELETE /api/admin/reports/{new_id} passed")

    print("\n=======================================================")
    print("ALL 18 BACKEND LOCATION & ADMIN UNIT TESTS PASSED!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_endpoints()
