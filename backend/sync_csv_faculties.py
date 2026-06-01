import asyncio
import csv
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import SessionLocal
from app.models.faculty import Faculty
from app.models.internship import Internship
from app.models.intern import Intern
from app.models.certificate import Certificate
from app.models.document import Document
from app.models.system_setting import SystemSetting

async def sync_faculties():
    csv_path = os.path.join(os.path.dirname(__file__), "..", "emp details.csv")
    
    if not os.path.exists(csv_path):
        print(f"CSV not found at {csv_path}")
        return

    added_count = 0
    seen_emails = set()
    async with SessionLocal() as session:
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Use split(',') as fallback if some emails have multiple, e.g. a,b@nitt.edu
                emails = [e.strip() for e in row["emp_email"].split(",")]
                for email in emails:
                    if not email or email in seen_emails: continue
                    seen_emails.add(email)
                    
                    result = await session.execute(select(Faculty).filter(Faculty.email == email))
                    faculty = result.scalars().first()
                    
                    if not faculty:
                        new_faculty = Faculty(
                            faculty_name=row["emp_name"].strip(),
                            email=email,
                            role="faculty"
                        )
                        session.add(new_faculty)
                        added_count += 1
                        print(f"Added: {row['emp_name']} ({email})")
        
        await session.commit()
        print(f"Successfully added {added_count} new faculties from CSV.")

if __name__ == "__main__":
    asyncio.run(sync_faculties())
