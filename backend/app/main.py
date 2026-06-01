from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.db.database import engine, Base
from sqlalchemy import text

from app.models.faculty import Faculty
from app.models.intern import Intern
from app.models.internship import Internship
from app.models.document import Document
from app.models.certificate import Certificate
from app.models.system_setting import SystemSetting

from app.api.routes import auth, interns, internships, documents, certificates, settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_internships_domain ON internships (internship_domain);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_interns_name ON interns (intern_name);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_internships_intern_id ON internships (intern_id);"))
        
        # Seed default system settings
        for key, val in [
            ("project_start_date", "2026-05-18"),
            ("project_end_date", "2026-07-31"),
            ("min_duration_days", "28"),
            ("max_students_per_faculty", "5"),
            ("max_students_per_year", "100"),
            ("allow_faculty_edit", "true")
        ]:
            await conn.execute(
                text("INSERT INTO system_settings (key, value) VALUES (:key, :val) ON CONFLICT (key) DO NOTHING;"),
                {"key": key, "val": val}
            )
        
    for query in [
        "ALTER TABLE faculties ADD COLUMN signature_path VARCHAR;",
        "ALTER TABLE internships ADD COLUMN transaction_number VARCHAR;",
        "ALTER TABLE internships ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE internships ADD COLUMN is_emailed BOOLEAN DEFAULT FALSE;"
    ]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(query))
        except Exception:
            pass
    yield

os.makedirs("uploads", exist_ok=True)
os.makedirs("generated_certificates", exist_ok=True)
os.makedirs("signatures", exist_ok=True)
app = FastAPI(title="Internship Management System", lifespan=lifespan)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [url.strip() for url in frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    print(f"[TIMING] {request.method} {request.url.path} took {process_time*1000:.2f}ms")
    response.headers["X-Process-Time"] = f"{process_time*1000:.2f}ms"
    return response

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/generated_certificates", StaticFiles(directory="generated_certificates"), name="generated_certificates")
app.mount("/signatures", StaticFiles(directory="signatures"), name="signatures")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(interns.router, prefix="/api/interns", tags=["interns"])
app.include_router(internships.router, prefix="/api/internships", tags=["internships"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["certificates"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

@app.get("/")
def root():
    return {
        "message": "Backend Running Successfully"
    }