from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.database import Base

class Otp(Base):
    __tablename__ = "otps"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    code = Column(
        String,
        nullable=False
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )
