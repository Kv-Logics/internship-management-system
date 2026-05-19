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

from app.api.routes import auth, interns, internships, documents, certificates

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_internships_domain ON internships (internship_domain);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_interns_name ON interns (intern_name);"))
    yield

os.makedirs("uploads", exist_ok=True)
os.makedirs("generated_certificates", exist_ok=True)
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