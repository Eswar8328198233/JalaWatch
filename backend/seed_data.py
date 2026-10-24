import os
import datetime
from database import get_db, init_db
from auth import hash_password

def seed():
    """Seeds the database with an admin user and realistic sample demonstration reports."""
    init_db()

    admin_username = os.environ.get("ADMIN_USERNAME", "admin")
    admin_password = os.environ.get("ADMIN_PASSWORD", "JalaWatchAdmin@2026")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@jalawatch.org")

    with get_db() as conn:
        cursor = conn.cursor()

        # Seed or update admin
        cursor.execute("SELECT id FROM admins WHERE username = ?", (admin_username,))
        existing_admin = cursor.fetchone()
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if not existing_admin:
            pwd_hash = hash_password(admin_password)
            cursor.execute("""
                INSERT INTO admins (username, email, password_hash, role, created_at)
                VALUES (?, ?, ?, 'admin', ?)
            """, (admin_username, admin_email, pwd_hash, now_str))
            print(f"[Seed] Created admin account: {admin_username}")
        else:
            print(f"[Seed] Admin account '{admin_username}' already exists.")

        # Seed sample reports if table is empty of demo records
        cursor.execute("SELECT COUNT(*) as count FROM reports")
        count = cursor.fetchone()["count"]

        if count == 0:
            sample_reports = [
                {
                    "id": "JW-2026-0101",
                    "village": "Nutakki",
                    "category": "Unusual water colour",
                    "water_source": "Borewell / Hand pump",
                    "date_observed": "2026-10-12",
                    "landmark": "Near Gram Panchayat Office & Main Bazar Borewell",
                    "description": "[DEMONSTRATION SAMPLE] Villagers noticed a distinct dark grey/black tint during morning pumping. Water clears slightly after 15 minutes of continuous discharge but leaves blackish ring in storage drums. Villagers suspect untreated domestic drain percolation.",
                    "photo_url": None,
                    "latitude": 16.4382,
                    "longitude": 80.6010,
                    "reporter_name": "Nutakki Resident (Field Survey)",
                    "reporter_contact": "nutakki.resident@demo.local",
                    "status": "Under Review",
                    "is_verified": 0,
                    "admin_notes": "Sample collection request logged. Forwarded notice to RWS&S subdivision for electrical conductivity and dissolved solids testing.",
                    "created_at": "2026-10-12T09:30:00Z",
                    "updated_at": "2026-10-14T11:20:00Z",
                    "is_demo": 1
                },
                {
                    "id": "JW-2026-0102",
                    "village": "Nutakki",
                    "category": "Drainage problems",
                    "water_source": "Stagnant pond / Seepage",
                    "date_observed": "2026-10-13",
                    "landmark": "North Harijanawada, Near ZP High School lane",
                    "description": "[DEMONSTRATION SAMPLE] No covered drainage channel exists along this 200m residential lane. Domestic greywater and bathroom runoff pool in roadside unlined ditches, seeping into surrounding soil less than 4 meters from shallow drinking water borewells.",
                    "photo_url": None,
                    "latitude": 16.4410,
                    "longitude": 80.6035,
                    "reporter_name": "Nutakki CSP Team Member",
                    "reporter_contact": "csp.survey@student.edu",
                    "status": "Submitted",
                    "is_verified": 0,
                    "admin_notes": "Added to village baseline report for soak pit and open drain recommendation to Gram Panchayat.",
                    "created_at": "2026-10-13T14:15:00Z",
                    "updated_at": "2026-10-13T14:15:00Z",
                    "is_demo": 1
                },
                {
                    "id": "JW-2026-0103",
                    "village": "Nutakki",
                    "category": "Bad smell or taste",
                    "water_source": "Borewell / Hand pump",
                    "date_observed": "2026-10-14",
                    "landmark": "Krishna River Bund approach road, East Nutakki",
                    "description": "[DEMONSTRATION SAMPLE] Noticeable rotten-egg (hydrogen sulfide) smell observed when opening community tap during peak afternoon heat. Locals avoid using it for cooking and fetch water from reverse-osmosis plant 1.5 km away.",
                    "photo_url": None,
                    "latitude": 16.4355,
                    "longitude": 80.6080,
                    "reporter_name": "Community Elder",
                    "reporter_contact": "",
                    "status": "Under Review",
                    "is_verified": 0,
                    "admin_notes": "Likely anaerobic organic decay or sewer infiltration in shallow aquifer. Recommended chlorination check and formal lab test.",
                    "created_at": "2026-10-14T08:45:00Z",
                    "updated_at": "2026-10-15T10:00:00Z",
                    "is_demo": 1
                },
                {
                    "id": "JW-2026-0104",
                    "village": "Tadepalli Rural",
                    "category": "Suspected waste dumping",
                    "water_source": "Open well",
                    "date_observed": "2026-10-15",
                    "landmark": "Old Kolanukonda Quarry Bypass road",
                    "description": "[DEMONSTRATION SAMPLE] Solid commercial packaging waste and plastic sacks observed dumped near open recharge depression. Rainwater drains directly past waste into permeable gravel bed.",
                    "photo_url": None,
                    "latitude": 16.4680,
                    "longitude": 80.5920,
                    "reporter_name": "Anonymous Farmer",
                    "reporter_contact": "",
                    "status": "Submitted",
                    "is_verified": 0,
                    "admin_notes": None,
                    "created_at": "2026-10-15T16:20:00Z",
                    "updated_at": "2026-10-15T16:20:00Z",
                    "is_demo": 1
                },
                {
                    "id": "JW-2026-0105",
                    "village": "Mangalagiri Rural",
                    "category": "Leaking pipes",
                    "water_source": "Piped tap water",
                    "date_observed": "2026-10-10",
                    "landmark": "Chinnakanchi Junction pipeline crossing",
                    "description": "[DEMONSTRATION SAMPLE] Main delivery conduit had a fractured joint submerged under stagnant ditch water. Turbid surface water entered line during low-pressure cycles. Local panchayat plumber replaced joint gasket on Oct 16.",
                    "photo_url": None,
                    "latitude": 16.4250,
                    "longitude": 80.5600,
                    "reporter_name": "Civic Volunteer",
                    "reporter_contact": "",
                    "status": "Resolved",
                    "is_verified": 0,
                    "admin_notes": "Pipe repaired and flushed by village maintenance team. Post-repair water tested clear.",
                    "created_at": "2026-10-10T11:00:00Z",
                    "updated_at": "2026-10-16T15:30:00Z",
                    "is_demo": 1
                },
                {
                    "id": "JW-2026-0106",
                    "village": "Kunchanapalli",
                    "category": "Agricultural runoff",
                    "water_source": "Irrigation ditch / Shallow well",
                    "date_observed": "2026-10-16",
                    "landmark": "Canal distributary 4 near culvert",
                    "description": "[DEMONSTRATION SAMPLE] Discarded fertilizer bags and chemical pesticide wash water dumped directly into canal culvert that feeds local aquifer recharge wells. Water displays greenish surface sheen.",
                    "photo_url": None,
                    "latitude": 16.4520,
                    "longitude": 80.6150,
                    "reporter_name": "Local Youth Club",
                    "reporter_contact": "",
                    "status": "Submitted",
                    "is_verified": 0,
                    "admin_notes": None,
                    "created_at": "2026-10-16T12:00:00Z",
                    "updated_at": "2026-10-16T12:00:00Z",
                    "is_demo": 1
                }
            ]

            for r in sample_reports:
                cursor.execute("""
                    INSERT INTO reports (
                        id, village, category, water_source, date_observed, landmark,
                        description, photo_url, latitude, longitude, reporter_name,
                        reporter_contact, status, is_verified, admin_notes,
                        created_at, updated_at, is_demo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    r["id"], r["village"], r["category"], r["water_source"], r["date_observed"],
                    r["landmark"], r["description"], r["photo_url"], r["latitude"], r["longitude"],
                    r["reporter_name"], r["reporter_contact"], r["status"], r["is_verified"],
                    r["admin_notes"], r["created_at"], r["updated_at"], r["is_demo"]
                ))
            print(f"[Seed] Successfully seeded {len(sample_reports)} demonstration reports.")
        else:
            print(f"[Seed] Database already contains {count} reports. Skipping report seeding.")

if __name__ == "__main__":
    seed()
