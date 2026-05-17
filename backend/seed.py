from app.db.database import SessionLocal, engine
from app.models.faculty import Faculty
from app.models.intern import Intern
from app.models.internship import Internship
from app.models.document import Document
from app.models.certificate import Certificate
from datetime import date, timedelta
import uuid
import csv
import os
import asyncio
from sqlalchemy import select

async def seed_data():
    async with SessionLocal() as db:
        # Load faculties from CSV
        csv_path = os.path.join(os.path.dirname(__file__), 'emp details.csv')
        if not os.path.exists(csv_path):
            # Try workspace root
            csv_path = os.path.join(os.path.dirname(__file__), '..', 'emp details.csv')
            
        if os.path.exists(csv_path):
            seen_emails = set()
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    email = row['emp_email'].split(',')[0].strip() # Take first email if multiple exist
                    if not email or email in seen_emails: 
                        continue
                    seen_emails.add(email)
                    
                    stmt = select(Faculty).filter(Faculty.email == email)
                    result = await db.execute(stmt)
                    if not result.scalars().first():
                        faculty = Faculty(
                            faculty_name=row['emp_name'].strip(),
                            email=email
                        )
                        db.add(faculty)
            await db.commit()
            print("Loaded real faculties from CSV.")

        # Add demo intern
        stmt = select(Intern).filter(Intern.email == "intern@student.edu")
        result = await db.execute(stmt)
        intern = result.scalars().first()
        if not intern:
            intern = Intern(
                intern_name="John Doe",
                college_name="NIT Engineering College",
                department="Information Technology",
                email="intern@student.edu",
                phone="1234567890"
            )
            db.add(intern)
            await db.commit()
            await db.refresh(intern)
            
            # Fetch a faculty to assign as mentor
            fac_stmt = select(Faculty)
            fac_result = await db.execute(fac_stmt)
            mentor = fac_result.scalars().first()
            
            if mentor:
                internship = Internship(
                    intern_id=intern.intern_id,
                    internship_title="Machine Learning Research",
                    internship_domain="AI/ML",
                    faculty_id=mentor.faculty_id,
                    start_date=date.today() - timedelta(days=30),
                    end_date=date.today() + timedelta(days=30)
                )
                db.add(internship)
                await db.commit()
                print("Created demo intern and internship linked to mentor:", mentor.faculty_name)
            else:
                print("Failed to create demo internship: No faculties seeded.")

if __name__ == "__main__":
    asyncio.run(seed_data())