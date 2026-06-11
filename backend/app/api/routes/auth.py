from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import secrets
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from pydantic import BaseModel
from email.message import EmailMessage

from app.db.database import get_db
from app.models.faculty import Faculty
from app.models.otp import Otp
from app.models.refresh_token import RefreshToken
from app.utils.email import send_email_with_settings

router = APIRouter()

# JWT helper utilities
def create_access_token(email: str, name: str, expires_delta: timedelta = None) -> str:
    secret = os.getenv("JWT_ACCESS_SECRET") or os.getenv("SECRET_KEY", "change_this_access_secret")
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode = {
        "sub": email,
        "email": email,
        "name": name,
        "exp": int(expire.timestamp())
    }
    return jwt.encode(to_encode, secret, algorithm="HS256")

def create_refresh_token(email: str, expires_delta: timedelta = None) -> str:
    secret = os.getenv("JWT_REFRESH_SECRET") or os.getenv("SECRET_KEY", "change_this_refresh_secret")
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode = {
        "sub": email,
        "exp": int(expire.timestamp())
    }
    return jwt.encode(to_encode, secret, algorithm="HS256")

from app.api.deps import get_current_faculty
from app.schemas.faculty import FacultyResponse
from typing import List, Optional
from uuid import UUID

class OtpRequest(BaseModel):
    email: str

@router.post("/request-otp")
async def request_otp(data: OtpRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    if not email.endswith("@nitt.edu"):
        raise HTTPException(status_code=400, detail="Only @nitt.edu email addresses are permitted.")
        
    # Check if user exists in faculties
    stmt = select(Faculty).filter(Faculty.email == email)
    result = await db.execute(stmt)
    faculty = result.scalars().first()
    
    if not faculty:
        raise HTTPException(status_code=400, detail="This email is not registered. Please contact the system administrator to register your account.")
        
    # Generate 6-digit OTP code
    code = str(secrets.randbelow(900000) + 100000)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    
    # Store OTP in DB (upserting by email)
    otp_stmt = select(Otp).filter(Otp.email == email)
    otp_result = await db.execute(otp_stmt)
    existing_otp = otp_result.scalars().first()
    
    if existing_otp:
        existing_otp.code = code
        existing_otp.expires_at = expires_at
        db.add(existing_otp)
    else:
        new_otp = Otp(email=email, code=code, expires_at=expires_at)
        db.add(new_otp)
        
    await db.commit()
    
    # Send email
    msg = EmailMessage()
    msg['Subject'] = "Your NITT Login Verification Code"
    msg['To'] = email
    
    html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>NITT Authentication</h2>
          <p>Your one-time password (OTP) for login is:</p>
          <h1 style="color: #4f46e5; letter-spacing: 5px;">{code}</h1>
          <p>This code will expire in 5 minutes. Do not share it with anyone.</p>
        </div>
    """
    
    msg.set_content(html_content, subtype='html')
    
    try:
        await send_email_with_settings(db, msg, use_env_only=True)
    except Exception as e:
        print(f"SMTP Warning: Failed to dispatch verification email: {e}")
            
    # Print code to logs in development for easy local testing
    print(f"\n-----------------------------------------")
    print(f"[LOCAL BYPASS OTP] FOR {email}: {code}")
    print(f"-----------------------------------------\n")
    
    return {"success": True, "message": "Verification OTP sent successfully."}

class LoginRequest(BaseModel):
    email: str
    otp: str

@router.post("/login")
async def login(request: Request, response: Response, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email.strip().lower()
    otp_code = data.otp.strip()
    
    # Validate OTP
    otp_stmt = select(Otp).filter(Otp.email == email, Otp.code == otp_code)
    otp_result = await db.execute(otp_stmt)
    db_otp = otp_result.scalars().first()
    
    if not db_otp:
        raise HTTPException(status_code=401, detail="Invalid OTP code or no active request found.")
        
    expires_at = db_otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.delete(db_otp)
        await db.commit()
        raise HTTPException(status_code=401, detail="OTP code has expired. Please request a new one.")
        
    # Delete OTP code from DB upon successful verification
    await db.delete(db_otp)
    
    # Find or dynamically create/upsert Faculty record
    stmt = select(Faculty).filter(Faculty.email == email)
    result = await db.execute(stmt)
    faculty = result.scalars().first()
    
    if not faculty:
        raise HTTPException(status_code=401, detail="User not found.")
            
    # Generate Access and Refresh tokens
    access_token = create_access_token(email=email, name=faculty.faculty_name)
    refresh_token = create_refresh_token(email=email)
    
    # Save RefreshToken in DB
    ref_stmt = select(RefreshToken).filter(RefreshToken.email == email)
    ref_result = await db.execute(ref_stmt)
    existing_ref = ref_result.scalars().first()
    
    ref_expires = datetime.now(timezone.utc) + timedelta(days=7)
    if existing_ref:
        existing_ref.token = refresh_token
        existing_ref.expires_at = ref_expires
        db.add(existing_ref)
    else:
        new_ref = RefreshToken(email=email, token=refresh_token, expires_at=ref_expires)
        db.add(new_ref)
        
    await db.commit()
    
    # Determine if running in secure (HTTPS) environment
    is_secure = (
        request.headers.get("x-forwarded-proto", "http") == "https" or
        request.url.scheme == "https"
    )
    
    # Set cookies
    response.set_cookie(
        key="accessToken",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    response.set_cookie(
        key="refreshToken",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "success": True,
        "user": {
            "faculty_id": str(faculty.faculty_id),
            "faculty_name": faculty.faculty_name,
            "email": faculty.email,
            "role": faculty.role,
            "department": faculty.department,
            "signature_path": faculty.signature_path,
        },
        "token": access_token
    }

@router.post("/refresh")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refreshToken")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token is required.")
        
    secret = os.getenv("JWT_REFRESH_SECRET") or os.getenv("SECRET_KEY", "change_this_refresh_secret")
    try:
        payload = jwt.decode(refresh_token, secret, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid refresh token payload.")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")
        
    ref_stmt = select(RefreshToken).filter(RefreshToken.token == refresh_token)
    ref_result = await db.execute(ref_stmt)
    db_ref = ref_result.scalars().first()
    
    if not db_ref:
        raise HTTPException(status_code=401, detail="Session does not exist. Please log in again.")
        
    expires_at = db_ref.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.delete(db_ref)
        await db.commit()
        raise HTTPException(status_code=401, detail="Refresh token has expired. Please log in again.")
        
    stmt = select(Faculty).filter(Faculty.email == email)
    result = await db.execute(stmt)
    faculty = result.scalars().first()
    if not faculty:
        raise HTTPException(status_code=401, detail="User not found.")
        
    new_access_token = create_access_token(email=email, name=faculty.faculty_name)
    new_refresh_token = create_refresh_token(email=email)
    
    db_ref.token = new_refresh_token
    db_ref.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db.add(db_ref)
    await db.commit()
    
    # Determine if running in secure (HTTPS) environment
    is_secure = (
        request.headers.get("x-forwarded-proto", "http") == "https" or
        request.url.scheme == "https"
    )
    
    response.set_cookie(
        key="accessToken",
        value=new_access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=15 * 60
    )
    
    response.set_cookie(
        key="refreshToken",
        value=new_refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {"success": True}

@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refreshToken")
    if refresh_token:
        stmt = select(RefreshToken).filter(RefreshToken.token == refresh_token)
        result = await db.execute(stmt)
        db_ref = result.scalars().first()
        if db_ref:
            await db.delete(db_ref)
            await db.commit()
            
    is_secure = (
        request.headers.get("x-forwarded-proto", "http") == "https" or
        request.url.scheme == "https"
    )
    
    response.delete_cookie(
        key="accessToken",
        path="/",
        secure=is_secure,
        samesite="lax",
    )
    response.delete_cookie(
        key="refreshToken",
        path="/",
        secure=is_secure,
        samesite="lax",
    )
    return {"success": True, "message": "Logged out successfully."}

@router.get("/faculties", response_model=List[FacultyResponse])
async def list_faculties(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None, 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") not in ("dean", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view faculties")
    
    query = select(Faculty)
    if search:
        query = query.filter(
            (Faculty.faculty_name.ilike(f"%{search}%")) |
            (Faculty.email.ilike(f"%{search}%")) |
            (Faculty.role.ilike(f"%{search}%")) |
            (Faculty.department.ilike(f"%{search}%"))
        )
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/me")
async def get_me(current_user = Depends(get_current_faculty)):
    return {
        "faculty_id": str(current_user.faculty_id),
        "faculty_name": current_user.faculty_name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department,
        "signature_path": current_user.signature_path,
    }

from pydantic import BaseModel
class DepartmentUpdate(BaseModel):
    department: str
@router.put("/me/department")
async def update_department(
    data: DepartmentUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_faculty)
):
    dept_name = data.department
    current_user.department = dept_name
    db.add(current_user)
    await db.commit()
    return {"message": "Department updated successfully", "department": dept_name}

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

class NewUserCreate(BaseModel):
    email: str
    faculty_name: str
    role: str
    department: str = None

@router.post("/admin/users", response_model=FacultyResponse)
async def create_user(
    data: NewUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only system administrators can create new users")
        
    result = await db.execute(select(Faculty).filter(Faculty.email == data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="User with this email already exists")
        
    new_faculty = Faculty(
        email=data.email,
        faculty_name=data.faculty_name,
        role=data.role,
        department=data.department
    )
    db.add(new_faculty)
    await db.commit()
    await db.refresh(new_faculty)
    
    return new_faculty

import uuid

@router.post("/faculty/signature")
async def upload_signature(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image (PNG, JPG, etc.).")
        
    from app.utils.filenames import get_faculty_prefix
    faculty_prefix = get_faculty_prefix(current_user.email)
    
    ext = (file.filename or "signature.png").split(".")[-1].lower()
    if ext not in ("png", "jpg", "jpeg"):
        raise HTTPException(status_code=400, detail="Forbidden file type. Only PNG, JPG, and JPEG signatures are allowed.")
        
    filename = f"{faculty_prefix}_sign.{ext}"
    os.makedirs("signatures", exist_ok=True)
    filepath = os.path.join("signatures", filename)
    
    # Remove existing signature file to avoid clutter
    if current_user.signature_path and os.path.exists(current_user.signature_path):
        try:
            os.remove(current_user.signature_path)
        except Exception as e:
            print(f"Failed to delete old signature file: {e}")
            
    contents = await file.read()
    with open(filepath, "wb") as buffer:
        buffer.write(contents)
        
    # Update the current user's signature_path in the database
    # Standardize path slashes for cross-platform compatibility
    normalized_path = filepath.replace("\\", "/")
    current_user.signature_path = normalized_path
    db.add(current_user)
    await db.commit()
    
    return {"message": "Signature uploaded successfully", "signature_path": normalized_path}

