from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DocumentBase(BaseModel):
    document_type: str

class DocumentResponse(DocumentBase):
    document_id: UUID
    internship_id: UUID
    file_path: str
    class Config:
        from_attributes = True