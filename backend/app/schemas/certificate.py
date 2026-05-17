from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class CertificateResponse(BaseModel):
    certificate_id: UUID
    internship_id: UUID
    certificate_path: str
    certificate_number: Optional[str] = None
    
    class Config:
        from_attributes = True