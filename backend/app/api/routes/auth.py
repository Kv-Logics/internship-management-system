from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import secrets
import os
import time

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
    
    # Use cryptographically secure random number generator
    otp = f"{secrets.randbelow(900000) + 100000}"
    OTP_STORE[request.email] = {"otp": otp, "expires": time.time() + 300}  # 5 min expiry
    
    # In production, send OTP via email/SMS. For dev, log to console.
    print(f"[DEV OTP] {request.email}: {otp}")
    return {"message": "OTP sent successfully", "otp": otp}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(request: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Faculty).filter(Faculty.email == request.email))
    faculty = result.scalars().first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Email not found")
        
    stored = OTP_STORE.get(request.email)
    if not stored:
        raise HTTPException(status_code=401, detail="No OTP was requested for this email. Please request a new one.")
    if time.time() > stored["expires"]:
        del OTP_STORE[request.email]
        raise HTTPException(status_code=401, detail="OTP has expired. Please request a new one.")
    if stored["otp"] != request.otp:
        raise HTTPException(status_code=401, detail="Invalid OTP. Please check and try again.")
        
    # Clean up OTP after successful use
    del OTP_STORE[request.email]
    
    access_token = create_access_token(data={"sub": faculty.email, "role": faculty.role})
    return {"access_token": access_token, "token_type": "bearer", "faculty_name": faculty.faculty_name, "role": faculty.role}

@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    admin_user = os.getenv("ADMIN_USERNAME", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD")
    if not admin_pass:
        raise HTTPException(status_code=500, detail="Admin credentials not configured on server.")
    if secrets.compare_digest(request.username, admin_user) and secrets.compare_digest(request.password, admin_pass):
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

@router.get("/me")
async def get_me(current_user = Depends(get_current_faculty)):
    return {
        "faculty_id": str(current_user.faculty_id),
        "faculty_name": current_user.faculty_name,
        "email": current_user.email,
        "role": current_user.role,
        "dept": getattr(current_user, "dept", ""),
        "signature_path": current_user.signature_path,
    }

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

import uuid

@router.post("/faculty/signature")
async def upload_signature(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image (PNG, JPG, etc.).")
        
    ext = (file.filename or "signature.png").split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    os.makedirs("signatures", exist_ok=True)
    filepath = os.path.join("signatures", filename)
    
    contents = await file.read()
    with open(filepath, "wb") as buffer:
        buffer.write(contents)
        
    # Update the current user's signature_path in the database
    current_user.signature_path = filepath
    db.add(current_user)
    await db.commit()
    
    return {"message": "Signature uploaded successfully", "signature_path": filepath}

from sqlalchemy import text
from typing import Dict, Any
from datetime import date, datetime

@router.post("/admin/query")
async def run_raw_query(
    request: Dict[str, Any], 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only system administrators can execute raw database queries.")
    
    query_str = request.get("query")
    if not query_str:
        raise HTTPException(status_code=400, detail="Query string is required.")
        
    try:
        # Strip comments from query string first to prevent comments containing single quotes (e.g. Peter's) from throwing off parity count
        query_lines = []
        for line in query_str.split("\n"):
            line_strip = line.strip()
            # Skip comment lines
            if line_strip.startswith("--") or line_strip.startswith("#"):
                continue
            # Remove inline comments if not inside quotes
            if "--" in line:
                parts = line.split("--")
                if parts[0].count("'") % 2 == 0:
                    query_lines.append(parts[0])
                    continue
            query_lines.append(line)
        cleaned_query = "\n".join(query_lines)

        # Robustly split cleaned query string by semicolons while ignoring semicolons inside string literals using quote parity check
        statements = []
        current = []
        for char in cleaned_query:
            if char == ';':
                # Semicolon is outside single quotes if we have seen an even number of single quotes
                accumulated = "".join(current)
                if accumulated.count("'") % 2 == 0:
                    stmt_str = accumulated.strip()
                    if stmt_str:
                        statements.append(stmt_str)
                    current = []
                    continue
            current.append(char)
        stmt_str = "".join(current).strip()
        if stmt_str:
            statements.append(stmt_str)

        # Execute statements sequentially in a single transaction
        last_result = None
        total_rows_affected = 0
        
        for stmt in statements:
            cleaned_stmt = stmt.strip()
            if not cleaned_stmt:
                continue
                
            last_result = await db.execute(text(cleaned_stmt))
            if not last_result.returns_rows:
                total_rows_affected += (last_result.rowcount or 0)
        
        if last_result and last_result.returns_rows:
            rows = last_result.fetchall()
            keys = last_result.keys()
            output = []
            for row in rows:
                row_dict = {}
                for k, v in zip(keys, row):
                    if isinstance(v, (UUID, date, datetime)):
                        row_dict[k] = str(v)
                    else:
                        row_dict[k] = v
                output.append(row_dict)
            await db.commit()
            return {"type": "select", "columns": list(keys), "rows": output}
        else:
            await db.commit()
            return {"type": "mutation", "rowcount": total_rows_affected}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
