from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class FacultyBase(BaseModel):
    faculty_name: str
    email: EmailStr
    role: Optional[str] = "faculty"

class FacultyCreate(FacultyBase):
    pass


class FacultyResponse(FacultyBase):
    faculty_id: UUID
    class Config:
        from_attributes = True