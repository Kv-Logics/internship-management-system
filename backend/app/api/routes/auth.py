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
        # Robustly split query string by semicolons while ignoring semicolons inside string literals using quote parity check
        statements = []
        current = []
        for char in query_str:
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
            # Strip comments and ensure statement is not empty
            lines = [line.strip() for line in stmt.split("\n") if line.strip() and not line.strip().startswith("--")]
            cleaned_stmt = "\n".join(lines).strip()
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