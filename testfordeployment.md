### **Application Fixes & Deployment Summary**

* **1. 500 Internal Server Error on Login**
* **The Bug:** The backend was crashing on authentication routes because it couldn't find the JWT secret keys in the Docker environment.
* **The Fix:** Generated a proper `.env.production` file at the root of the project to securely inject the database credentials and JWT secrets into the Docker containers.


* **2. Missing Departments List (CSV Parsing)**
* **The Bug:** The frontend was showing an empty list for departments because the backend was looking exactly 4 folders up for `departments_list.csv`. This failed inside the flatter Docker `/app` container structure.
* **The Fix:** Updated `settings.py` to intelligently check multiple path levels, ensuring the CSV is successfully found and seeded in both local and production environments.


* **3. Certificate Font Mismatch**
* **The Bug:** Certificates generated on the server were using a tiny, default pixel font because the minimal Python Docker image didn't have the required Times or DejaVu Serif fonts installed.
* **The Fix:** Created a `fonts/` folder in the project root, copied exact `timesbd.ttf` and `times.ttf` fonts into it, and updated `Dockerfile.backend` to bundle them, guaranteeing pixel-perfect font matching across all environments.


* **4. Certificate Printing "Domain" instead of "Department" on Edit**
* **The Bug:** When generating a certificate initially, it correctly printed the cleanly formatted Faculty's Department. However, if an internship was edited, the auto-regeneration logic mistakenly printed the user-entered "Internship Domain" instead.
* **The Fix:** Updated `internships.py` to mirror the logic in `certificates.py`, ensuring it always fetches and formats the Faculty's official department.


* **5. Aggressive 15-Minute Auto-Logouts**
* **The Bug:** Despite having a 7-day refresh token system on the backend, the frontend was completely ignoring it and kicking the user out once the 15-minute access token expired.
* **The Fix:** Added a robust Axios Interceptor to `frontend/src/services/api.js`. Now, when a token expires, the frontend silently intercepts the error, grabs a fresh token in the background, and seamlessly continues the user's action.


* **6. Hardcoded Super Admin Backdoor**
* **The Bug:** A specific email (`114123003@nitt.edu`) was hardcoded into `deps.py`, `auth.py`, and `seed.py` to always bypass security checks and grant Admin access.
* **The Fix:** Pinpointed exactly where these hardcoded lines exist so they can be safely deleted to rely purely on the database for Role-Based Access Control (RBAC).


* **7. Sample Report Download Error**
* **The Bug/Fix:** Addressed and resolved the errors preventing the successful download of sample reports.


* **8. Clean Deployment & Nginx Configuration (ims.nitt.edu)**
* **The Issue:** Previously, certificates, reports, and signatures were stored locally, which required `sudo` commands and caused Nginx permission problems during deployment.
* **The Action Plan:** Execute a fresh, clean deployment from scratch at `ims.nitt.edu` to ensure these storage and permission errors are permanently resolved and not repeated.