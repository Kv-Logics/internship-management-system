import asyncio
import os
import csv
from app.db.database import Base, engine, SessionLocal
from app.models.faculty import Faculty
from app.models.intern import Intern
from app.models.internship import Internship
from app.models.document import Document
from app.models.certificate import Certificate

async def seed_data():
    print("Initializing Database Refresh...")
    
    # 1. Drop all tables to completely delete all DB contents
    async with engine.begin() as conn:
        print("Dropping all existing database tables...")
        await conn.run_sync(Base.metadata.drop_all)
        
        print("Creating fresh database tables from redesigned schema...")
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database tables created successfully!")

    # 2. Seed data inside a unified transaction session
    async with SessionLocal() as db:
        # Load faculties from the CSV file
        csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'emp details.csv'))
        if not os.path.exists(csv_path):
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'emp details.csv'))
            
        print(f"Reading faculty data from: {csv_path}")
        
        if os.path.exists(csv_path):
            seen_emails = set()
            faculties_to_add = []
            
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    emp_name = row.get('emp_name', '').strip()
                    emp_email = row.get('emp_email', '').strip()
                    
                    # Split multiple emails if any, grab the primary one
                    email = emp_email.split(',')[0].strip().lower()
                    if not email or email in seen_emails:
                        continue
                        
                    seen_emails.add(email)
                    
                    faculty = Faculty(
                        faculty_name=emp_name,
                        email=email,
                        role="faculty"
                    )
                    faculties_to_add.append(faculty)
            
            # Add all faculties read from CSV
            db.add_all(faculties_to_add)
            print(f"Successfully loaded {len(faculties_to_add)} faculties from CSV.")
        else:
            print("WARNING: emp details.csv not found! Skipping CSV loading.")

        # 3. Seed required administrator and Dean roles
        # System Administrator
        admin = Faculty(
            faculty_name="Administrator",
            email="114123003@nitt.edu",
            role="admin"
        )
        db.add(admin)
        
        # Research Dean
        dean = Faculty(
            faculty_name="Dean RC",
            email="deanrc@nitt.edu",
            role="dean"
        )
        db.add(dean)
        
        await db.commit()
        print("Administrator (114123003@nitt.edu) and Dean (deanrc@nitt.edu) seeded successfully!")
        
        # 4. Seed a dummy completed intern for jpeter@nitt.edu
        from sqlalchemy import select
        from datetime import datetime, timedelta
        
        jpeter_result = await db.execute(select(Faculty).filter(Faculty.email == "jpeter@nitt.edu"))
        jpeter = jpeter_result.scalars().first()
        
        if jpeter:
            dummy_intern = Intern(
                intern_name="keerthi vasan",
                email="01@nitt.edu", 
                phone="9876543210",
                college_name="NIT Trichy",
                department="Computer Science"
            )
            db.add(dummy_intern)
            await db.flush() 
            
            dummy_internship = Internship(
                intern_id=dummy_intern.intern_id,
                faculty_id=jpeter.faculty_id,
                internship_title="Advanced Software Engineering",
                internship_domain="Web Development",
                internship_mode="Online",
                start_date=datetime.utcnow().date() - timedelta(days=60),
                end_date=datetime.utcnow().date() - timedelta(days=10),
                is_paid=True, 
                is_emailed=False
            )
            db.add(dummy_internship)
            await db.commit()
            print("Successfully seeded completed dummy intern 'keerthi vasan' for jpeter@nitt.edu")
        
    print("Database seeding completed cleanly!")

if __name__ == "__main__":
    asyncio.run(seed_data())