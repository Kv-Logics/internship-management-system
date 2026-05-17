from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class InternBase(BaseModel):
    intern_name: str
    college_name: str
    department: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

class InternCreate(InternBase):
    pass

class InternResponse(InternBase):
    intern_id: UUID

    class Config:
        from_attributes = True