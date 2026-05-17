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

from app.api.routes import auth, interns, internships, documents, certificates

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_number VARCHAR UNIQUE;"))
        await conn.execute(text("ALTER TABLE faculties ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'faculty';"))
        
        # Seed Dean RC first so we always have at least one faculty for fallback backfilling
        await conn.execute(text("""
            INSERT INTO faculties (faculty_id, faculty_name, email, role)
            SELECT gen_random_uuid(), 'Dean RC', 'deanrc@nitt.edu', 'dean'
            WHERE NOT EXISTS (SELECT 1 FROM faculties WHERE email = 'deanrc@nitt.edu');
        """))
        
        # Add faculty_id column to internships if it does not exist
        await conn.execute(text("""
            ALTER TABLE internships 
            ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculties(faculty_id);
        """))
        
        # Backfill: Match old faculty_mentor string with seeded faculty names
        await conn.execute(text("""
            UPDATE internships 
            SET faculty_id = (
                SELECT faculty_id FROM faculties 
                WHERE faculties.faculty_name = internships.faculty_mentor 
                LIMIT 1
            ) 
            WHERE faculty_id IS NULL AND faculty_mentor IS NOT NULL;
        """))
        
        # Fallback Backfill: Match any remaining nulls to the Dean RC
        await conn.execute(text("""
            UPDATE internships 
            SET faculty_id = (
                SELECT faculty_id FROM faculties 
                WHERE email = 'deanrc@nitt.edu' 
                LIMIT 1
            ) 
            WHERE faculty_id IS NULL;
        """))
        
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_internships_domain ON internships (internship_domain);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_interns_name ON interns (intern_name);"))
    yield

os.makedirs("uploads", exist_ok=True)
os.makedirs("generated_certificates", exist_ok=True)
app = FastAPI(title="Internship Management System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/generated_certificates", StaticFiles(directory="generated_certificates"), name="generated_certificates")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(interns.router, prefix="/api/interns", tags=["interns"])
app.include_router(internships.router, prefix="/api/internships", tags=["internships"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["certificates"])

@app.get("/")
def root():
    return {
        "message": "Backend Running Successfully"
    }