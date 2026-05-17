from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    certificate_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    internship_id = Column(
        UUID(as_uuid=True),
        ForeignKey("internships.internship_id"),
        unique=True
    )
    certificate_path = Column(String, nullable=False)
    certificate_number = Column(String, unique=True, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    internship = relationship("Internship", back_populates="certificate")