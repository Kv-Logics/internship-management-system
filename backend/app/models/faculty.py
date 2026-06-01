from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship

from app.db.database import Base

class Faculty(Base):
    __tablename__ = "faculties"

    faculty_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    faculty_name = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    role = Column(String, nullable=False, default="faculty", server_default="faculty")
    
    department = Column(String, nullable=True)
    
    signature_path = Column(String, nullable=True)

    internships = relationship("Internship", back_populates="faculty", cascade="all, delete-orphan")