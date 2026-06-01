import asyncio
import os
import sys
import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

async def run_tests():
    print("=== STARTING NEW VALIDATION RULES INTEGRATION TESTS ===")
    
    # 1. Admin login
    res = requests.post(f"{BASE_URL}/auth/admin/login", json={"username": "admin", "password": "adminadmin"})
    if res.status_code != 200:
        print("[-] Admin login failed!")
        sys.exit(1)
    admin_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Retrieve current settings
    settings = requests.get(f"{BASE_URL}/settings/").json()
    print(f"[+] Loaded settings: {settings}")
    
    # Retrieve faculties list to get a valid faculty_id
    fac_res = requests.get(f"{BASE_URL}/auth/faculties", headers=admin_headers)
    if fac_res.status_code != 200:
        print("[-] Failed to fetch faculties list")
        sys.exit(1)
    faculties = fac_res.json()
    if len(faculties) == 0:
        print("[-] No faculty members present in database to associate test internship.")
        sys.exit(1)
    faculty_id = faculties[0]["faculty_id"]
    print(f"[+] Using faculty_id: {faculty_id}")

    # 2. Register a new intern to link internships to
    intern_email = f"test-{uuid.uuid4().hex[:6]}@example.com"
    intern_payload = {
        "intern_name": "Validation Test Student",
        "college_name": "NIT Trichy",
        "email": intern_email,
        "phone": "9999999999",
        "department": "Computer Applications"
    }
    intern_res = requests.post(f"{BASE_URL}/interns/", json=intern_payload, headers=admin_headers)
    if intern_res.status_code != 200:
        print(f"[-] Failed to register intern: {intern_res.text}")
        sys.exit(1)
    intern_id = intern_res.json()["intern_id"]
    print(f"[+] Intern created with ID: {intern_id}")

    # 3. Test Internship 1: Start date on or after academic year start, valid end, valid duration (SHOULD SUCCEED)
    start_dt_str = settings.get("project_start_date", "2026-05-18")
    end_dt_str = settings.get("project_end_date", "2026-07-31")
    payload_valid = {
        "internship_title": "AI & ML Intern Project",
        "internship_domain": "Artificial Intelligence",
        "internship_mode": "Hybrid",
        "start_date": start_dt_str,
        "end_date": end_dt_str,
        "faculty_id": faculty_id,
        "remarks": "Test validations"
    }
    res = requests.post(f"{BASE_URL}/internships/{intern_id}", json=payload_valid, headers=admin_headers)
    print(f"[*] Valid internship registration status: {res.status_code} (Expected: 200)")
    if res.status_code != 200:
        print(f"[-] Valid internship registration failed: {res.text}")
        sys.exit(1)

    # 3b. Test Internship 1b: Start date prior to academic year start (SHOULD FAIL)
    # Start: 2020-01-01 (before Academic Year Start Date)
    payload_invalid_start = {
        "internship_title": "AI & ML Intern Project",
        "internship_domain": "Artificial Intelligence",
        "internship_mode": "Hybrid",
        "start_date": "2020-01-01",
        "end_date": end_dt_str,
        "faculty_id": faculty_id,
        "remarks": "Test validations"
    }
    res = requests.post(f"{BASE_URL}/internships/{intern_id}", json=payload_invalid_start, headers=admin_headers)
    print(f"[*] Invalid start date registration status: {res.status_code} (Expected: 400)")
    if res.status_code != 400:
        print(f"[-] Invalid start date registration was unexpectedly allowed or returned wrong status: {res.status_code}")
        sys.exit(1)

    # 4. Test Internship 2: End date after Academic Year End Date (SHOULD FAIL)
    # End: 2026-08-05 (after 2026-07-31)
    payload_invalid_end = {
        "internship_title": "AI & ML Intern Project",
        "internship_domain": "Artificial Intelligence",
        "internship_mode": "Hybrid",
        "start_date": "2026-05-10",
        "end_date": "2026-08-05",
        "faculty_id": faculty_id,
        "remarks": "Test validations"
    }
    res = requests.post(f"{BASE_URL}/internships/{intern_id}", json=payload_invalid_end, headers=admin_headers)
    print(f"[*] Invalid end date registration status: {res.status_code} (Expected: 400)")
    if res.status_code != 400:
        print(f"[-] Invalid end date registration was unexpectedly allowed or returned wrong status: {res.status_code}")
        sys.exit(1)

    # 5. Test Internship 3: Duration less than minimum days (SHOULD FAIL)
    # Start: 2026-05-10, End: 2026-05-20 (duration 10 days < 28)
    payload_invalid_duration = {
        "internship_title": "AI & ML Intern Project",
        "internship_domain": "Artificial Intelligence",
        "internship_mode": "Hybrid",
        "start_date": "2026-05-10",
        "end_date": "2026-05-20",
        "faculty_id": faculty_id,
        "remarks": "Test validations"
    }
    res = requests.post(f"{BASE_URL}/internships/{intern_id}", json=payload_invalid_duration, headers=admin_headers)
    print(f"[*] Invalid duration registration status: {res.status_code} (Expected: 400)")
    if res.status_code != 400:
        print(f"[-] Invalid duration registration was unexpectedly allowed or returned wrong status: {res.status_code}")
        sys.exit(1)

    print("\n[+++] ALL NEW DATE BOUNDARY VALIDATION INTEGRATION TESTS PASSED! [+++]")

if __name__ == "__main__":
    asyncio.run(run_tests())
