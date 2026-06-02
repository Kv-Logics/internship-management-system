
import asyncio
from app.db.database import SessionLocal
from app.models.faculty import Faculty
from app.models.otp import Otp
from sqlalchemy.future import select

async def test_login():
    async with SessionLocal() as db:
        # Check OTP
        email = '114123003@nitt.edu'
        otp_stmt = select(Otp).filter(Otp.email == email)
        result = await db.execute(otp_stmt)
        db_otp = result.scalars().first()
        if db_otp:
            print('Found OTP', db_otp.code)
            await db.delete(db_otp)
        
        stmt = select(Faculty).filter(Faculty.email == email)
        result = await db.execute(stmt)
        faculty = result.scalars().first()
        
        if not faculty:
            print('Creating faculty...')
            faculty = Faculty(
                email=email,
                faculty_name='Administrator',
                role='admin'
            )
            db.add(faculty)
            await db.commit()
            await db.refresh(faculty)
            print('Created faculty!')
        else:
            print('Faculty already exists!')

asyncio.run(test_login())

