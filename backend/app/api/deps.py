from fastapi import Request, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import JWTError, jwt
import os
from app.db.database import get_db
from app.models.faculty import Faculty
import logging

logger = logging.getLogger(__name__)

async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    token = request.cookies.get("accessToken")
    auth_header = request.headers.get("Authorization")
    print(f"DEBUG: Cookie token: {token}, Auth Header: {auth_header}")
    if not token:
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            print("DEBUG: No token found in cookies or auth header")
            raise credentials_exception

    try:
        secret = os.getenv("JWT_ACCESS_SECRET")
        print(f"DEBUG: Using secret: {secret}")
        if not secret:
            logger.error("JWT_ACCESS_SECRET not configured")
            raise HTTPException(status_code=500, detail="Internal server error: Missing JWT secret configuration")
            
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        email: str = payload.get("email") or payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        print(f"JWT verification failed: {e}")
        raise credentials_exception

    if email == "114123003@nitt.edu":
        return Faculty(
            faculty_id="00000000-0000-0000-0000-000000000000",
            faculty_name="Administrator",
            email="114123003@nitt.edu",
            role="admin"
        )

    # Upsert user based on SSO token payload
    result = await db.execute(select(Faculty).filter(Faculty.email == email))
    faculty = result.scalars().first()
    
    is_primary_admin = (email == "114123003@nitt.edu")
    
    if not faculty:
        faculty = Faculty(
            email=email,
            faculty_name=payload.get("name") or payload.get("faculty_name") or email.split('@')[0],
            role="admin" if is_primary_admin else (payload.get("role") or "faculty")
        )
        db.add(faculty)
        await db.commit()
        await db.refresh(faculty)
    elif is_primary_admin and faculty.role != "admin":
        faculty.role = "admin"
        db.add(faculty)
        await db.commit()
        await db.refresh(faculty)
        
    return faculty

# Alias for backward compatibility
get_current_faculty = get_current_user