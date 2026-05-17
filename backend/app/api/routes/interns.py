from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.intern import Intern
from app.models.internship import Internship
from app.schemas.intern import InternCreate, InternResponse
from app.api.deps import get_current_faculty

router = APIRouter()

@router.post("/", response_model=InternResponse)
async def create_intern(intern: InternCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    count_result = await db.execute(select(func.count()).select_from(Internship).filter(Internship.faculty_id == current_user.faculty_id))
    if count_result.scalar() >= 5:
        raise HTTPException(status_code=400, detail="Faculty can only mentor a maximum of 5 interns.")
        
    new_intern = Intern(**intern.model_dump())
    db.add(new_intern)
    await db.commit()
    await db.refresh(new_intern)
    return new_intern

@router.get("/", response_model=List[InternResponse])
async def read_interns(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    result = await db.execute(select(Intern).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{intern_id}", response_model=InternResponse)
async def read_intern(intern_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    result = await db.execute(select(Intern).filter(Intern.intern_id == intern_id))
    intern = result.scalars().first()
    if intern is None:
        raise HTTPException(status_code=404, detail="Intern not found")
    return intern