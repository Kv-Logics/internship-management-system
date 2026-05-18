from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import date
from .document import DocumentResponse
from .intern import InternResponse
from .certificate import CertificateResponse
from .faculty import FacultyResponse

class InternshipBase(BaseModel):
    internship_title: str
    internship_domain: Optional[str] = None
    faculty_mentor: Optional[str] = None
    internship_mode: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    remarks: Optional[str] = None

class InternshipCreate(InternshipBase):
    faculty_id: Optional[UUID] = None

class InternshipUpdate(InternshipBase):
    intern_email: Optional[EmailStr] = None
    intern_name: Optional[str] = None
    intern_phone: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None

class InternshipResponse(InternshipBase):
    internship_id: UUID
    intern_id: UUID
    faculty_id: Optional[UUID] = None
    intern: Optional[InternResponse] = None
    faculty: Optional[FacultyResponse] = None
    documents: Optional[List[DocumentResponse]] = []
    certificate: Optional[CertificateResponse] = None

    class Config:
        from_attributes = True