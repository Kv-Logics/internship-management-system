from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import random

from app.db.database import get_db
from app.models.faculty import Faculty
from app.schemas.faculty import FacultyCreate, FacultyResponse, OTPRequest, OTPVerifyRequest
from app.schemas.token import Token
from app.core.security import create_access_token
from pydantic import BaseModel

class AdminLoginRequest(BaseModel):
    username: str
    password: str

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

@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    if request.username == "admin" and request.password == "muruga":
        access_token = create_access_token(data={"sub": "admin@nitt.edu", "role": "admin"})
        return {"access_token": access_token, "token_type": "bearer", "faculty_name": "Administrator"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid administrator credentials"
    )

from app.api.deps import get_current_faculty
from app.schemas.faculty import FacultyResponse
from typing import List
from uuid import UUID

@router.get("/faculties", response_model=List[FacultyResponse])
async def list_faculties(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    if getattr(current_user, "role", "faculty") not in ("dean", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view faculties")
    result = await db.execute(select(Faculty))
    return result.scalars().all()

@router.delete("/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(faculty_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only system administrators can delete faculty records")
    result = await db.execute(select(Faculty).filter(Faculty.faculty_id == faculty_id))
    faculty = result.scalars().first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    await db.delete(faculty)
    await db.commit()
    return None