from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.internship import Internship
from uuid import UUID
from datetime import datetime

def get_faculty_prefix(email: str) -> str:
    """Extract username prefix from faculty email, e.g., faculty from faculty@nitt.edu"""
    if not email:
        return "faculty"
    return email.split("@")[0]

async def get_internship_index(db: AsyncSession, faculty_id: UUID, internship_id: UUID) -> int:
    """Compute the 1-based index of the current internship for a specific faculty, ordered by start_date and internship_id."""
    stmt = (
        select(Internship)
        .filter(Internship.faculty_id == faculty_id)
        .order_by(Internship.start_date, Internship.internship_id)
    )
    result = await db.execute(stmt)
    internships = result.scalars().all()
    for i, item in enumerate(internships):
        if item.internship_id == internship_id:
            return i + 1
    return 1

def get_internship_year_suffix(start_date) -> str:
    """Get two-digit year representation of the internship start date or current year, e.g. '26' for 2026."""
    if start_date:
        if isinstance(start_date, str):
            try:
                dt = datetime.strptime(start_date, "%Y-%m-%d")
                return dt.strftime("%y")
            except ValueError:
                pass
        else:
            return start_date.strftime("%y")
    return datetime.utcnow().strftime("%y")
