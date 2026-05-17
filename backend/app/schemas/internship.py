from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import date
from .document import DocumentResponse
from .intern import InternResponse
from .certificate import CertificateResponse

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

class InternshipResponse(InternshipBase):
    internship_id: UUID
    intern_id: UUID
    intern: Optional[InternResponse] = None
    documents: Optional[List[DocumentResponse]] = []
    certificate: Optional[CertificateResponse] = None

    class Config:
        from_attributes = True