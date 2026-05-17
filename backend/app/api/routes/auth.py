from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import random

from app.db.database import get_db
from app.models.faculty import Faculty
from app.schemas.faculty import FacultyCreate, FacultyResponse, OTPRequest, OTPVerifyRequest
from app.schemas.token import Token
from app.core.security import create_access_token

router = APIRouter()

OTP_STORE = {}

@router.post("/register", response_model=FacultyResponse)
async def register(faculty: FacultyCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Faculty).filter(Faculty.email == faculty.email))
    db_faculty = result.scalars().first()
    if db_faculty:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_faculty = Faculty(
        faculty_name=faculty.faculty_name,
        email=faculty.email,
        role=faculty.role
    )
    db.add(new_faculty)
    await db.commit()
    await db.refresh(new_faculty)
    return new_faculty

@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Faculty).filter(Faculty.email == request.email))
    faculty = result.scalars().first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Email not found in employee records")
    
    otp = str(random.randint(100000, 999999))
    OTP_STORE[request.email] = otp
    
    # Returning OTP in response for auto-fill functionality as requested
    return {"message": "OTP sent successfully", "otp": otp}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(request: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Faculty).filter(Faculty.email == request.email))
    faculty = result.scalars().first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Email not found")
        
    stored_otp = OTP_STORE.get(request.email)
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
        
    # Clean up OTP after use
    del OTP_STORE[request.email]
    
    access_token = create_access_token(data={"sub": faculty.email, "role": faculty.role})
    return {"access_token": access_token, "token_type": "bearer", "faculty_name": faculty.faculty_name}