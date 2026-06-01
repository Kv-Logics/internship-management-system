from sqlalchemy import Column, String, Date, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship

from app.db.database import Base

class Internship(Base):
    __tablename__ = "internships"

    internship_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    intern_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interns.intern_id"),
        index=True
    )

    internship_title = Column(String, nullable=False)

    internship_domain = Column(String, index=True)

    faculty_id = Column(
        UUID(as_uuid=True),
        ForeignKey("faculties.faculty_id"),
        nullable=False,
        index=True
    )

    internship_mode = Column(String)

    start_date = Column(Date)

    end_date = Column(Date)

    remarks = Column(String)

    transaction_number = Column(String, nullable=True)

    is_paid = Column(Boolean, default=False, server_default="false", nullable=False)
    is_emailed = Column(Boolean, default=False, server_default="false", nullable=False)

    intern = relationship("Intern", back_populates="internships")
    faculty = relationship("Faculty", back_populates="internships")
    documents = relationship("Document", back_populates="internship", cascade="all, delete")
    certificate = relationship("Certificate", back_populates="internship", uselist=False, cascade="all, delete")

    @property
    def faculty_mentor(self):
        return self.faculty.faculty_name if self.faculty else None