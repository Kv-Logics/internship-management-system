# 📘 PROJECT_CONTEXT.md
# Internship Management System — NIT Tiruchirappalli

> **Purpose of this file:** Read this file at the START of every new conversation instead of re-scanning the entire codebase. Update it whenever a new feature is added.

---

## 🗂️ Project Structure

```
internship-management-system/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Auth dependency: get_current_faculty
│   │   │   └── routes/
│   │   │       ├── auth.py         # Login, OTP, admin login, signature upload
│   │   │       ├── certificates.py # Generate, download, preview, verify cert
│   │   │       ├── internships.py  # CRUD for internships (auto-regen cert on update)
│   │   │       ├── interns.py      # CRUD for interns
│   │   │       ├── settings.py     # System settings API routes
│   │   │       └── documents.py    # Document upload
│   │   ├── core/
│   │   │   └── security.py        # JWT: create_access_token, verify_token
│   │   ├── db/
│   │   │   └── database.py        # Async SQLAlchemy engine + get_db
│   │   ├── models/
│   │   │   ├── faculty.py          # Faculty(faculty_id, faculty_name, email, role, signature_path)
│   │   │   ├── intern.py           # Intern(intern_id, intern_name, college_name, email, phone, department)
│   │   │   ├── internship.py       # Internship(internship_id, intern_id, faculty_id, title, domain, internship_mode, start_date, end_date, remarks, transaction_number, is_paid, is_emailed)
│   │   │   ├── certificate.py      # Certificate(cert_id, internship_id, certificate_number, certificate_path)
│   │   │   ├── system_setting.py   # SystemSetting(key, value)
│   │   │   └── document.py         # Document(document_id, internship_id, document_type, file_path, uploaded_at)
│   │   ├── schemas/                # Pydantic schemas (mirrors models)
│   │   ├── services/
│   │   │   └── certificate_service.py  # generate_certificate_pdf() — ReportLab PDF generator
│   │   └── main.py                 # FastAPI app, CORS, static mounts, DB migration on startup
│   ├── generated_certificates/     # Output folder for PDFs
│   ├── signatures/                 # Faculty e-signature images
│   ├── uploads/                    # Document uploads (uploads/reports/ for student reports)
│   ├── nitt_logo.png               # NIT Trichy official logo
│   └── .env                        # DATABASE_URL, SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, SENDER_EMAIL, SENDER_PASSWORD, FRONTEND_URL
│
├── frontend/                       # Next.js 16 frontend (App Router)
│   ├── public/
│   │   └── nitt_logo.png           # Logo for frontend (mix-blend-multiply to blend UI)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.jsx          # Root layout (wraps everything in ProtectedLayout)
│   │   │   ├── layout-client.jsx   # Sidebar + auth guard & redirects
│   │   │   ├── providers.jsx       # AuthContext + React Query provider
│   │   │   ├── page.jsx            # Dashboard (/)
│   │   │   ├── login/page.jsx      # OTP login
│   │   │   ├── internships/        # List + Add + Edit internship pages
│   │   │   ├── faculties/          # Faculty database (admin/dean read)
│   │   │   ├── signature/page.jsx  # Upload E-Sign (faculty only, react-easy-crop)
│   │   │   ├── admin/
│   │   │   │   ├── settings/       # System Settings admin panel
│   │   │   │   ├── verify/         # Certificate verification admin page
│   │   │   │   └── terminal/       # SQL query console admin page
│   │   │   ├── payments/           # Payments verification portal (admin only)
│   │   │   └── emails/             # Certificate emailing portal (admin only)
│   │   ├── components/
│   │   │   ├── faculties/
│   │   │   │   ├── SystemSettingsPanel.jsx # Setting configuration tabs
│   │   │   │   └── VerifyCertificateTab.jsx
│   │   │   └── internship/
│   │   │       ├── InternshipTable.jsx
│   │   │       ├── EditInternshipModal.jsx
│   │   │       ├── PreviewInternshipModal.jsx
│   │   │       └── TransactionInputModal.jsx
│   │   └── services/
│   │       └── api.js              # Axios instance with base URL + JWT interceptor
│   ├── .env.local                  # NEXT_PUBLIC_API_URL=http://localhost:8000/api
│   └── package.json
```

---

## 🔑 Key Design Decisions

| Decision | Detail |
|---|---|
| **Auth** | OTP-based (email), JWT stored in localStorage. Admin has separate username/password login |
| **Roles** | `faculty` (max 5 interns by default), `admin` (full access), `dean` (read-only planned / viewing profiles) |
| **PDF Engine** | ReportLab Platypus (`Frame` + `Paragraph`). Landscape letter. NITT logo + watermark at 6% opacity |
| **Certificate ID** | `NITT-{8 char hex}`, stored in `Certificate.certificate_number`, used for public verify |
| **PDF auto-regen** | Any `PUT /internships/{id}` automatically regenerates the PDF with updated data |
| **E-Signature** | Faculty uploads via `/api/auth/faculty/signature`. Stored in `backend/signatures/`. Overlaid on PDF at bottom-left above FACULTY MENTOR line |
| **Admin verify** | Certificate verification is restricted to administrators. Relocated to `/admin/verify` portal. Uses `GET /api/certificates/verify/{cert_number}` |
| **System Settings** | Configured by admin. Key-value registry (`project_start_date`, `project_end_date`, `min_duration_days`, `max_students_per_faculty`, `max_students_per_year`, `allow_faculty_edit`) enforcing global bounds dynamically |
| **Internship Mode** | Locked to `"Offline"` mode only. Dropdowns in frontend forms are disabled and preset to `"Offline"` to ensure compliance |
| **Decline Remarks** | Saved under `remarks` column of `internships`. Configured by admin during payment rejection, shown directly to faculty mentors on the internships list |
| **Report Re-uploads** | Faculty mentors can download and re-upload report documents. Re-uploading automatically deletes the older report file from disk and DB first to keep file storage clean |
| **No Tx Number during Reg** | The Transaction Number field is removed from the Add Intern form; payment verification is performed post-registration by admin via the Payments Portal |

---

## 🗄️ Database Schema (PostgreSQL/SQLite via SQLAlchemy async)

```
faculties         → faculty_id (UUID PK), faculty_name, email, role, signature_path
interns           → intern_id (UUID PK), intern_name, college_name, email, phone, department
internships       → internship_id (UUID PK), intern_id (FK), faculty_id (FK), internship_title,
                     internship_domain, internship_mode, start_date, end_date, remarks, transaction_number, is_paid, is_emailed
certificates      → cert_id (UUID PK), internship_id (FK unique), certificate_number, certificate_path, generated_at
documents         → document_id (UUID PK), internship_id (FK), document_type, file_path, uploaded_at
system_settings   → key (VARCHAR PK), value (VARCHAR)
```

---

## 🌐 API Routes Summary

### Auth (`/api/auth`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register faculty |
| POST | `/send-otp` | Public | Send OTP to email |
| POST | `/verify-otp` | Public | Verify OTP → JWT |
| POST | `/admin/login` | Public | Admin username/password login |
| GET | `/faculties` | Admin/Dean | List all faculties |
| GET | `/me` | Auth | Returns current faculty profile incl. `signature_path` |
| DELETE | `/faculties/{id}` | Admin | Delete faculty |
| POST | `/faculty/signature` | Auth | Upload/replace e-signature image |
| POST | `/admin/query` | Admin | Run raw SQL query |

### Internships (`/api/internships`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/{intern_id}` | Auth | Create internship for intern |
| GET | `/` | Auth | List internships (faculty sees own, admin sees all) |
| GET | `/{id}` | Auth | Get single internship |
| PUT | `/{id}` | Auth | Update + auto-regen PDF |
| DELETE | `/{id}` | Auth | Delete internship |

### Certificates (`/api/certificates`)
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/generate/{internship_id}` | Auth | Generate certificate PDF |
| GET | `/download/{internship_id}` | Auth | Download PDF (auto-generates if missing) |
| GET | `/preview/{internship_id}` | Auth | Preview PDF inline |
| GET | `/verify/{cert_number}` | Admin | Verify certificate by ID |
| POST | `/email/{internship_id}` | Auth | Email certificate to intern |

### Settings (`/api/settings`)
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Retrieve all system configurations |
| PUT | `/` | Admin | Update system configurations |

---

## 🧩 Frontend Routes

| Route | Access | Description |
|---|---|---|
| `/login` | Public | OTP login |
| `/` | Auth | Dashboard with stats |
| `/internships` | Auth | List internships |
| `/internships/add` | Auth (≤4 interns or admin) | Add new intern + internship |
| `/internships/[id]` | Auth | View/Edit internship detail |
| `/faculties` | Admin/Dean | Faculty directory and search (with verification & settings tab links for admin) |
| `/signature` | Faculty/Dean | Upload E-Sign with crop tool |
| `/dean/faculties` | Dean only | Search + list all faculty mentors |
| `/dean/faculties/[id]` | Dean only | Faculty profile — all interns & projects under that mentor |
| `/payments` | Admin only | Payments Portal for transaction entry, verification, and rejection with remarks |
| `/emails` | Admin only | Certificate Emailing portal |
| `/admin/settings` | Admin only | System Settings config panel |
| `/admin/verify` | Admin only | Certificate verification panel |
| `/admin/terminal` | Admin only | SQL Query Terminal console |

---

## 🖨️ Certificate PDF Layout (Pillow Image Overlay)

- **Canvas Size**: 1536 × 1024 px (Aspect Ratio 3:2), based on `reference_image.jpeg`
- **Output Format**: Exported directly to PDF at 100 DPI
- **Fonts**: Times New Roman (`times.ttf` and `timesbd.ttf` standard Windows system fonts)
- **Overlay Coordinates**:
  - **Verification ID**: Top-Right (`X = 1150`, `Y = 55`)
  - **Student Name**: Centered on underline (`X = 855`, `Y = 348`, 28pt bold)
  - **College Name**: Centered on underline (`X = 607`, `Y = 388`, 28pt bold)
  - **Start Date**: Split day/month/year centered over template slashes (`X = 430/480/545`, `Y = 578`, 28pt bold)
  - **End Date**: Split day/month/year centered over template slashes (`X = 610/660/725`, `Y = 578`, 28pt bold)
  - **Project Title**: Wrapped line 1 (`X = 760`, `Y = 678`) and line 2 (`X = 760`, `Y = 718`, 28pt bold)
  - **Mentor Name**: Centered on underline (`X = 847`, `Y = 728`, 28pt bold)
  - **Issue Date**: Bottom-Left day/month/year (`X = 148/185/245`, `Y = 958`, 28pt bold)
  - **Mentor Signature**: Centered over baseline (`X = 425`, `Y = 830 - height`, auto-scaled)
  - **Dean Signature**: Centered over baseline (`X = 1130`, `Y = 830 - height`, auto-scaled)

---

## ⚙️ Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
SECRET_KEY=your-jwt-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
SENDER_EMAIL=your@email.com
SENDER_PASSWORD=app-password
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🚀 How to Run

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev        # runs on http://localhost:3000
```

---

## 📋 Patterns to Follow When Adding Features

### Adding a new backend route:
1. Add route handler in `backend/app/api/routes/`
2. Register in `main.py` with `app.include_router(...)`
3. Protect with `current_user = Depends(get_current_faculty)` or leave public

### Adding a new frontend page:
1. Create `frontend/src/app/<route>/page.jsx`
2. Add `'use client';` at the top
3. Add sidebar link in `layout-client.jsx` (with role check if needed)
4. If page should be PUBLIC, add path to the bypass block in `layout-client.jsx`

### Adding a new DB column:
- Add column to the SQLAlchemy model in `backend/app/models/`
- Add `ALTER TABLE ... ADD COLUMN ...` in the `lifespan()` try/except block in `main.py` (auto-migrates on restart)

### Adding a new Pydantic schema field:
- Update the relevant file in `backend/app/schemas/`

---

## 📦 Key Dependencies

### Backend
- `fastapi`, `uvicorn` — web framework
- `sqlalchemy[asyncio]`, `asyncpg` — async PostgreSQL ORM
- `reportlab` — PDF generation
- `Pillow (PIL)` — watermark image processing
- `python-jose` — JWT
- `python-dotenv` — env vars

### Frontend
- `next` 16 (App Router)
- `@tanstack/react-query` — data fetching
- `axios` — HTTP client
- `react-easy-crop` — signature crop tool
- `react-hot-toast` — notifications
- `lucide-react` — icons
- `tailwindcss` — styling

---

## 🔄 Last Updated
> 2026-05-19 — Added Faculty E-Signature feature (upload, crop, PDF overlay, faculty-only sidebar link)
> 2026-05-20 — Added Dean role pages. Fixed `providers.jsx` to read role from JWT response (not hardcode 'faculty'). Fixed `token.py` schema to include role. Added `GET /api/auth/me` endpoint. Rewrote `certificate_service.py` canonical version with `faculty_signature_path`, correct date format, bottom-left signature, bottom-right issue date. Rewrote `signature/page.jsx` to show existing sig preview + Replace button using `/me` + React Query invalidation. Converted Faculty directory to a line-by-line lightweight table view. Removed "Pending Signature" tab and status from all logins. Removed the recursive auto-generate certificate loop from faculties and internships pages, completely resolving performance issues and lagging. Added report/proof document viewing to the Dean's Faculty profile page. Changed default administrator password to `adminadmin`. Added query cache clearing on logout.
> 2026-05-26 — Added Admin Settings panel for dynamic control of internship dates and limits (project period boundaries, minimum duration days, and maximum students per faculty and globally per year).
> 2026-05-26 — Restricted certificate verification route to authenticated administrators only, relocated the verification portal to an admin tab, added report upload/download buttons to the table and preview modal, integrated payment transaction entry/verification workflow, and dynamically filtered out the Faculty Mentor column for faculty members.
> 2026-05-26 — Locked internship mode strictly to `"Offline"` mode only. Dropdowns are disabled and default to `"Offline"`. Updated report upload flow to clean old report files and DB records on re-upload. Enabled faculty mentor display of decline remarks on transaction rejections. Removed Transaction Number from Add Intern registration layout. Resolved frontend runtime ReferenceError of settings variable.
