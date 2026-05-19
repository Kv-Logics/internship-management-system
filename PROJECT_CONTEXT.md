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
│   │   │       └── documents.py    # Document upload
│   │   ├── core/
│   │   │   └── security.py        # JWT: create_access_token, verify_token
│   │   ├── db/
│   │   │   └── database.py        # Async SQLAlchemy engine + get_db
│   │   ├── models/
│   │   │   ├── faculty.py          # Faculty(faculty_id, faculty_name, email, role, signature_path)
│   │   │   ├── intern.py           # Intern(intern_id, intern_name, college_name, email, phone, department)
│   │   │   ├── internship.py       # Internship(internship_id, intern_id, faculty_id, title, domain, start_date, end_date, status)
│   │   │   ├── certificate.py      # Certificate(cert_id, internship_id, certificate_number, certificate_path)
│   │   │   └── document.py         # Document(document_id, internship_id, file_path)
│   │   ├── schemas/                # Pydantic schemas (mirrors models)
│   │   ├── services/
│   │   │   └── certificate_service.py  # generate_certificate_pdf() — ReportLab PDF generator
│   │   └── main.py                 # FastAPI app, CORS, static mounts, DB migration on startup
│   ├── generated_certificates/     # Output folder for PDFs
│   ├── signatures/                 # Faculty e-signature images
│   ├── uploads/                    # Document uploads
│   ├── nitt_logo.png               # NIT Trichy official logo
│   └── .env                        # DATABASE_URL, SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, SENDER_EMAIL, SENDER_PASSWORD, FRONTEND_URL
│
├── frontend/                       # Next.js 16 frontend (App Router)
│   ├── public/
│   │   └── nitt_logo.png           # Logo for frontend (mix-blend-multiply to blend UI)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.jsx          # Root layout (wraps everything in ProtectedLayout)
│   │   │   ├── layout-client.jsx   # Sidebar + auth guard. /verify is PUBLIC (bypasses auth)
│   │   │   ├── providers.jsx       # AuthContext + React Query provider
│   │   │   ├── page.jsx            # Dashboard (/)
│   │   │   ├── login/page.jsx      # OTP login
│   │   │   ├── internships/        # List + Add + Edit internship pages
│   │   │   ├── faculties/          # Faculty database (admin only)
│   │   │   ├── signature/page.jsx  # Upload E-Sign (faculty only, react-easy-crop)
│   │   │   └── verify/page.jsx     # PUBLIC certificate verification portal (split layout)
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
| **Roles** | `faculty` (max 5 interns), `admin` (full access), `dean` (read-only planned) |
| **PDF Engine** | ReportLab Platypus (`Frame` + `Paragraph`). Landscape letter. NITT logo + watermark at 6% opacity |
| **Certificate ID** | `NITT-{8 char hex}`, stored in `Certificate.certificate_number`, used for public verify |
| **PDF auto-regen** | Any `PUT /internships/{id}` automatically regenerates the PDF with updated data |
| **E-Signature** | Faculty uploads via `/api/auth/faculty/signature`. Stored in `backend/signatures/`. Overlaid on PDF at bottom-left above FACULTY MENTOR line |
| **Public verify** | `/verify` route bypasses auth in `layout-client.jsx`. Uses `GET /api/certificates/verify/{cert_number}` |

---

## 🗄️ Database Schema (PostgreSQL via SQLAlchemy async)

```
faculties         → faculty_id (UUID PK), faculty_name, email, role, signature_path
interns           → intern_id (UUID PK), intern_name, college_name, email, phone, department
internships       → internship_id (UUID PK), intern_id (FK), faculty_id (FK), internship_title,
                     internship_domain, start_date, end_date, status
certificates      → cert_id (UUID PK), internship_id (FK unique), certificate_number, certificate_path
documents         → document_id (UUID PK), internship_id (FK), file_path
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
| DELETE | `/faculties/{id}` | Admin | Delete faculty |
| POST | `/faculty/signature` | Auth | Upload e-signature image |
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
| GET | `/verify/{cert_number}` | **Public** | Verify certificate by ID |
| POST | `/email/{internship_id}` | Auth | Email certificate to intern |

---

## 🧩 Frontend Routes

| Route | Access | Description |
|---|---|---|
| `/login` | Public | OTP login |
| `/` | Auth | Dashboard with stats |
| `/internships` | Auth | List internships |
| `/internships/add` | Auth (≤4 interns or admin) | Add new intern + internship |
| `/internships/[id]` | Auth | View/Edit internship detail |
| `/faculties` | Admin only | Faculty management |
| `/signature` | **Faculty only** | Upload E-Sign with crop tool |
| `/verify` | **Public** | Certificate verification portal |

---

## 🖨️ Certificate PDF Layout (ReportLab)

- **Page**: Landscape Letter (11" × 8.5")
- **Border**: Dark outer (4.5pt) + blue inner (1pt)
- **Logo**: NITT logo at top center. Watermark (6% opacity) centered on page body
- **Verification ID**: Top-left, small gray text
- **Title**: `INTERNSHIP COMPLETION CERTIFICATE` (Times-Bold, 30pt, blue)
- **Body order**: "This is to certify that" → **Name** → body paragraph → project title (bold blue) → guidance line
- **Signature**: Faculty e-sign image overlaid at bottom-left (2" × 0.7") above `FACULTY MENTOR` label
- **Issue Date**: Bottom-right aligned, `Issued on: {end_date}`

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
