
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship

from app.db.database import Base

class Intern(Base):
    __tablename__ = "interns"

    intern_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    intern_name = Column(String, nullable=False, index=True)

    college_name = Column(String, nullable=False)

    department = Column(String, nullable=False)

    email = Column(String)

    phone = Column(String)

    internships = relationship("Internship", back_populates="intern", cascade="all, delete")