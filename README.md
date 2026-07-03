# Internship Management System — NIT Tiruchirappalli

**Live Demo**
- **Dashboard:** [http://ims.nitt.edu/](http://ims.nitt.edu/)
- **API Base:** [http://ims.nitt.edu/api](http://ims.nitt.edu/api) *(Placeholder)*

<p align="center">
  <img src="screenshots/dashboard.png" alt="Dashboard Preview" width="800">
</p>

## 📋 Table of Contents
1. [What Is the Internship Management System?](#what-is-the-internship-management-system)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Complete Data Flow](#complete-data-flow)
5. [Feature Highlights](#feature-highlights)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [Core Components — Deep Dive](#core-components--deep-dive)
9. [API Reference](#api-reference)
10. [Installation & Setup](#installation--setup)
11. [How to Run](#how-to-run)
12. [Dashboard Walkthrough](#dashboard-walkthrough)
13. [The Logic Behind Certificate Generation](#the-logic-behind-certificate-generation)
14. [Interview Q&A — What Recruiters Will Ask](#interview-qa--what-recruiters-will-ask)
15. [Deployment](#deployment)
16. [Roadmap](#roadmap)
17. [Author](#author)

---

## What Is the Internship Management System?
The Internship Management System (IMS) is a full-stack, comprehensive web platform built specifically for the National Institute of Technology, Tiruchirappalli (NITT). It digitizes, automates, and enforces compliance over the entire lifecycle of student internships (summer/winter), bridging the gap between faculties, administrators, the Dean, and student interns.

## Project Overview
Historically, internship management, certificate issuance, and compliance checking at NITT involved heavy paperwork. IMS replaces this with a secure, role-based, dynamic web application. It automates PDF certificate generation using ReportLab, enforces maximum intern limits per faculty dynamically, supports E-Signature integration, and centralizes payment verifications—all securely gated by OTP and JWT-based authentication.

## System Architecture
The application follows a decoupled client-server architecture:
- **Client Layer:** Next.js 16 (App Router) handling the UI, dynamic routing, and caching via React Query.
- **API Layer:** FastAPI exposing asynchronous RESTful endpoints.
- **Service Layer:** Python-based modules for OTP emails, ReportLab PDF rendering, and Pillow (PIL) for image/signature processing.
- **Data Layer:** PostgreSQL accessed asynchronously via SQLAlchemy.

## Complete Data Flow
1. **Registration:** Faculty register, verify OTP, and access their dashboard.
2. **Onboarding:** Admin sets global boundaries via System Settings (e.g., project dates, max students).
3. **Intern Entry:** Faculty adds an intern; the system validates against global limits and auto-locks mode to "Offline".
4. **Verification:** Admin reviews payments in the Payment Portal, marking transactions as verified or rejected (with remarks).
5. **Certificate Auto-Gen:** Once verified, the backend generates a unique `NITT-XXXXXXXX` ID and overlays student data and faculty/dean E-signatures onto the NITT certificate template.
6. **Access:** Faculty or Admin can view/download/email the certificate. The Dean can search faculty profiles to monitor the workflow globally.

## Feature Highlights
- **Role-Based Workflows:** Distinct views and authorities for `faculty`, `admin`, and `dean`.
- **Dynamic System Config:** Admin can change the rules of the system instantly without redeploying code.
- **Automated PDF Engine:** Flawless generation of customized, watermarked certificates using precise coordinate mapping.
- **Image Processing Engine:** In-browser cropping of signatures (`react-easy-crop`) paired with backend transparency generation.
- **Auto-Regen Pipeline:** Edits to an intern automatically trigger background regeneration of their certificate.
- **Public Verification Portal:** Anyone can enter a certificate ID to verify its authenticity.

## Tech Stack
- **Frontend:** Next.js 16, TailwindCSS, React Query, Axios, Lucide React, React-Easy-Crop.
- **Backend:** FastAPI, Python, SQLAlchemy (asyncpg), ReportLab, Pillow, Python-JOSE (JWT).
- **Database:** PostgreSQL.
- **Deployment:** Nginx, Uvicorn (Linux Server Environment).

## Project Structure
```text
internship-management-system/
├── backend/                        
│   ├── app/
│   │   ├── api/routes/      # Auth, Certificates, Internships, Settings
│   │   ├── models/          # SQLAlchemy Models
│   │   ├── schemas/         # Pydantic Schemas
│   │   ├── services/        # PDF & Email Services
│   │   └── main.py          # FastAPI App Entrypoint
│   ├── generated_certificates/
│   └── signatures/
└── frontend/                       
    ├── src/
    │   ├── app/             # Next.js 16 App Router (Admin, Dean, Faculty routes)
    │   ├── components/      # Reusable UI widgets
    │   └── services/        # Axios API instances
```

## Core Components — Deep Dive

### 1 · OTP & Role-Based Auth
The system completely bypasses traditional passwords for faculties, utilizing an Email OTP system for secure, password-less logins. The JWT token stores the role (`faculty`, `admin`, `dean`), dynamically rendering the Next.js sidebar and restricting API access.

### 2 · PDF Generation Engine (ReportLab)
The certificate engine reads an official `reference_image.jpeg` at 1536x1024 resolution. It uses ReportLab's Canvas to precisely overlay dynamically wrapped text (Project Titles, Names) and signature images (processed via Pillow) using exact X/Y coordinates.

### 3 · Dynamic System Settings
Administrators control the entire ecosystem through the `system_settings` table. Global constraints like `max_students_per_faculty` and `project_end_date` are fetched dynamically by the frontend, blocking form submissions if a faculty attempts to violate compliance rules.

### 4 · Signature Processing Pipeline
Faculties upload signatures via a specialized UI that allows in-browser cropping to maintain aspect ratio. The backend uses Pillow (PIL) to handle the image, ensuring it is properly sized and processed with transparency before being stamped onto the certificates.

### 5 · Payment Verification & Tracking
Instead of assuming compliance, the Payment Portal enables administrators to review every single transaction number. If payment is invalid, admins reject it and leave specific remarks, which immediately appear on the faculty's dashboard.

## API Reference
Here is a snapshot of the core endpoints. All protected routes require a JWT Bearer token.
- `POST /api/auth/send-otp` - Dispatch authentication OTP.
- `GET /api/internships/` - List internships based on Role.
- `PUT /api/settings/` - Update global application rules.
- `GET /api/certificates/verify/{cert_number}` - Public verification of a certificate.
- `POST /api/auth/faculty/signature` - Upload/replace E-Sign.

## Installation & Setup
### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL database

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd internship-management-system
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
SECRET_KEY=your_secure_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminadmin
SENDER_EMAIL=your_smtp_email@gmail.com
SENDER_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## How to Run
```bash
# Terminal 1: Run Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Run Frontend
cd frontend
npm run dev
```

## Dashboard Walkthrough
*Note to Author: Please capture and save screenshots in a `screenshots/` directory for these to render properly.*

**1. Authentication Portal:**
<img src="screenshots/login.png" width="600" alt="Login">

**2. Faculty Dashboard:**
<img src="screenshots/dashboard.png" width="600" alt="Dashboard">

**3. Signature Cropping & Upload:**
<img src="screenshots/signature_upload.png" width="600" alt="Signature Upload">

**4. Admin System Settings:**
<img src="screenshots/admin_settings.png" width="600" alt="Admin Settings">

**5. Dean Overview Profile:**
<img src="screenshots/dean_faculty_profile.png" width="600" alt="Dean Profile">

**6. Final Generated Certificate:**
<img src="screenshots/sample_certificate.png" width="600" alt="Generated Certificate">

## The Logic Behind Certificate Generation
Auto-generating a beautiful PDF in Python isn't trivial. The system relies on **ReportLab** to draw over an existing image template. Because names and project titles vary wildly in length, we use algorithmic text-wrapping and dynamic font scaling. The backend also executes a cleanup routine: whenever an internship's details are updated via the UI, the existing PDF is physically deleted and re-rendered in the background so stale data never persists.

## Interview Q&A — What Recruiters Will Ask

**Q: Why use FastAPI over Django/Flask for this?**
*A: FastAPI provides native asynchronous support (async/await), which pairs perfectly with `asyncpg` for PostgreSQL. It handles multiple concurrent I/O operations (like fetching DB records while generating PDFs and sending emails) significantly faster than synchronous frameworks.*

**Q: How did you handle the PDF coordinate mapping across different screen resolutions?**
*A: The PDF is rendered on the server at a fixed, hardcoded canvas size of 1536x1024, enforcing a strict 3:2 aspect ratio. We used absolute X/Y coordinate overlays. This guarantees the certificate looks identical regardless of the user's browser or device.*

**Q: How is security handled for the administrative controls?**
*A: JWTs contain role claims (`faculty`, `admin`, `dean`). The backend FastAPI dependencies (`get_current_faculty`) specifically block non-admins from hitting endpoints like `/api/settings`. Even if a user alters the frontend UI, the backend will reject the request with a 403 Forbidden.*

**Q: What happens if a faculty uploads a massive, distorted signature image?**
*A: We utilized `react-easy-crop` on the frontend to enforce a fixed aspect ratio and allow the user to crop visually. The backend PIL (Pillow) engine then resizes and compresses the cropped image, standardizing the payload before stamping it on the certificate.*

## Deployment
- **Proxy Server:** Nginx configured to route port 80/443 traffic to the Next.js frontend and `/api` paths to the Uvicorn backend.
- **Process Manager:** `pm2` for Next.js, and `systemd` or `supervisor` for the FastAPI Uvicorn workers.
- **Production Docker Ports:**
  - **Host HTTP:** 6006 (Proxied to internal Nginx 80)
  - **Host HTTPS:** 6443 (Proxied to internal Nginx 443)
  - **Internal Services:** Database (5432), Backend (8000), and Frontend (3000) are isolated on the internal Docker network and not exposed directly to the host server.
- **Database:** Managed PostgreSQL instance securely isolated via VPC.

## Roadmap
- [ ] Export Analytics to Excel/CSV for the Dean.
- [ ] Integrate an AWS S3 bucket for scalable PDF/Document storage.
- [ ] Add bulk-emailing capabilities for finalized certificates.
- [ ] Add student login portal to track their own verification status.

## Author
**Keerthi Vasan A**  
*Built during the Internship at National Institute of Technology, Tiruchirappalli.*
