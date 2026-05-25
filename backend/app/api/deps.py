import os
from fastapi import Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.database import get_db
from app.models.faculty import Faculty

JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET") or os.getenv("SECRET_KEY", "supersecretkey123")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

ROLE_MAP = {
    "ADMIN": "admin",
    "DEAN": "dean",
    "DIRECTOR": "dean",
    "FACULTY": "faculty",
    "HOD": "faculty",
    "SECURITY": "faculty",
    "STUDENT": "faculty",
}

def normalize_role(role: str | None) -> str:
    return ROLE_MAP.get((role or "FACULTY").upper(), "faculty")

def display_name_from_email(email: str) -> str:
    return email.split("@")[0].replace(".", " ").replace("_", " ").title()

def get_access_token(request: Request) -> str | None:
    auth_header = request.headers.get("authorization")
    bearer_token = auth_header.split(" ", 1)[1] if auth_header and auth_header.lower().startswith("bearer ") else None
    return request.cookies.get("accessToken") or bearer_token

async def get_current_faculty(request: Request, db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = get_access_token(request)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, JWT_ACCESS_SECRET, algorithms=[ALGORITHM])
        email: str = payload.get("email") or payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    role = normalize_role(payload.get("role"))
    if role == "admin" or email == "admin@nitt.edu":
        return Faculty(
            faculty_id="00000000-0000-0000-0000-000000000000",
            faculty_name="Administrator",
            email="admin@nitt.edu",
            role="admin"
        )

    result = await db.execute(select(Faculty).filter(Faculty.email == email))
    faculty = result.scalars().first()

    if faculty is None:
        faculty = Faculty(
            faculty_name=display_name_from_email(email),
            email=email,
            role=role,
        )
        db.add(faculty)
        await db.commit()
        await db.refresh(faculty)
    elif faculty.role != role:
        faculty.role = role
        db.add(faculty)
        await db.commit()
        await db.refresh(faculty)

    faculty.dept = payload.get("dept", "")
    return faculty
