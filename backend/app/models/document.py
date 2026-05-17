from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.database import Base

class Document(Base):
    __tablename__ = "documents"

    document_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    internship_id = Column(
        UUID(as_uuid=True),
        ForeignKey("internships.internship_id"),
        index=True
    )
    document_type = Column(String, nullable=False) # e.g., 'bonafide', 'offer_letter', 'report'
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    internship = relationship("Internship", back_populates="documents")