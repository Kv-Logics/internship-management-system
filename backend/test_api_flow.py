import asyncio
import os
import sys
import requests

# Set base URL of the running FastAPI server
BASE_URL = "http://127.0.0.1:8000/api"

async def run_tests():
    print("=== STARTING API FLOW INTEGRATION TESTS ===")
    
    # 1. Admin login to retrieve token
    print("\n1. Testing admin login...")
    admin_login_url = f"{BASE_URL}/auth/admin/login"
    login_payload = {
        "username": "admin",
        "password": "adminadmin"
    }
    
    res = requests.post(admin_login_url, json=login_payload)
    if res.status_code != 200:
        print(f"[-] Admin login failed! Status: {res.status_code}, Detail: {res.text}")
        sys.exit(1)
        
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[+] Admin login successful! Token retrieved.")

    # 2. Retrieve a seeded faculty email from DB or check list
    print("\n2. Getting seeded faculty members...")
    faculties_url = f"{BASE_URL}/auth/faculties"
    res = requests.get(faculties_url, headers=admin_headers)
    if res.status_code != 200:
        print(f"[-] Failed to retrieve faculties list. Status: {res.status_code}, Detail: {res.text}")
        sys.exit(1)
        
    faculties = res.json()
    faculty_email = None
    for f in faculties:
        if f["role"] == "faculty":
            faculty_email = f["email"]
            break
            
    if not faculty_email:
        print("[-] No faculty user found in DB to test OTP login.")
        sys.exit(1)
        
    print(f"[+] Found faculty user to test: {faculty_email}")

    # 3. Faculty OTP login flow
    print("\n3. Testing faculty login via OTP...")
    send_otp_url = f"{BASE_URL}/auth/send-otp"
    res = requests.post(send_otp_url, json={"email": faculty_email})
    if res.status_code != 200:
        print(f"[-] Send OTP failed. Status: {res.status_code}, Detail: {res.text}")
        sys.exit(1)
        
    otp = res.json()["otp"]
    print(f"[+] OTP sent successfully. OTP is: {otp}")
    
    verify_otp_url = f"{BASE_URL}/auth/verify-otp"
    res = requests.post(verify_otp_url, json={"email": faculty_email, "otp": otp})
    if res.status_code != 200:
        print(f"[-] Verify OTP failed. Status: {res.status_code}, Detail: {res.text}")
        sys.exit(1)
        
    faculty_token = res.json()["access_token"]
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    print("[+] Faculty login successful! Token retrieved.")

    # 4. Verify system settings retrieval is open
    print("\n4. Testing GET system settings (public/open)...")
    settings_url = f"{BASE_URL}/settings/"
    res = requests.get(settings_url)
    if res.status_code != 200:
        print(f"[-] Failed to get settings. Status: {res.status_code}")
        sys.exit(1)
        
    original_settings = res.json()
    print(f"[+] Settings retrieved successfully: {original_settings}")

    # 5. Verify system settings modification permissions
    print("\n5. Testing system settings modification...")
    # Faculty modification (should fail with 403)
    res = requests.put(settings_url, json={"min_duration_days": "30"}, headers=faculty_headers)
    print(f"[*] Faculty modification status: {res.status_code} (Expected: 403)")
    if res.status_code != 403:
        print(f"[-] Faculty was unexpectedly allowed to modify settings or returned wrong status: {res.status_code}")
        sys.exit(1)
        
    # Admin modification with invalid date (should fail with 400)
    res = requests.put(settings_url, json={"project_start_date": "invalid-date"}, headers=admin_headers)
    print(f"[*] Admin invalid date modification status: {res.status_code} (Expected: 400)")
    if res.status_code != 400:
        print(f"[-] Server accepted invalid date format or returned wrong status: {res.status_code}")
        sys.exit(1)
        
    # Admin modification (should succeed)
    modified_min_days = "25"
    res = requests.put(settings_url, json={"min_duration_days": modified_min_days}, headers=admin_headers)
    print(f"[*] Admin modification status: {res.status_code} (Expected: 200)")
    if res.status_code != 200:
        print(f"[-] Admin failed to update settings: {res.text}")
        sys.exit(1)
        
    # Verify modification persisted
    res = requests.get(settings_url)
    current_settings = res.json()
    if current_settings.get("min_duration_days") != modified_min_days:
        print(f"[-] Modification did not persist! Expected: {modified_min_days}, Got: {current_settings.get('min_duration_days')}")
        sys.exit(1)
    print("[+] Settings modification persisted and validated successfully.")

    # 6. Verify certificate verification route security controls
    print("\n6. Testing certificate verification route security...")
    # Let's see if we have any certificates in the system
    # We will search using raw DB helper or query internships
    internships_url = f"{BASE_URL}/internships/"
    res = requests.get(internships_url, headers=admin_headers)
    if res.status_code != 200:
        print(f"[-] Failed to fetch internships: {res.text}")
        sys.exit(1)
        
    internships = res.json()
    test_cert_number = "NITT-TEST12345"
    
    # We will test verification path using a fake certificate first
    verify_url = f"{BASE_URL}/certificates/verify/{test_cert_number}"
    
    # Faculty verification request (should fail with 403 Forbidden)
    res = requests.get(verify_url, headers=faculty_headers)
    print(f"[*] Faculty verification status: {res.status_code} (Expected: 403)")
    if res.status_code != 403:
        print(f"[-] Faculty member was allowed to call verification API or returned wrong status: {res.status_code}")
        sys.exit(1)
        
    # Public verification request (should fail with 401 Unauthorized because of missing token)
    res = requests.get(verify_url)
    print(f"[*] Anonymous verification status: {res.status_code} (Expected: 401)")
    if res.status_code != 401:
        print(f"[-] Unauthenticated request was allowed or returned wrong status: {res.status_code}")
        sys.exit(1)
        
    # Admin verification request (should return 404 since it's a fake cert, which verifies route access works for admins)
    res = requests.get(verify_url, headers=admin_headers)
    print(f"[*] Admin verification status for fake cert: {res.status_code} (Expected: 404)")
    if res.status_code != 404:
        print(f"[-] Admin request returned unexpected status: {res.status_code}, Detail: {res.text}")
        sys.exit(1)

    # 7. Restore original settings
    print("\n7. Restoring original system settings...")
    res = requests.put(settings_url, json=original_settings, headers=admin_headers)
    if res.status_code != 200:
        print("[-] Failed to restore original system settings.")
        sys.exit(1)
    print("[+] Original settings restored successfully.")
    
    print("\n[+++] ALL INTEGRATION TESTS PASSED SUCCESSFULLY! [+++]")

if __name__ == "__main__":
    asyncio.run(run_tests())
