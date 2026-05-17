from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import joinedload

from app.db.database import get_db
from app.models.internship import Internship
from app.models.intern import Intern
from app.schemas.internship import InternshipCreate, InternshipResponse, InternshipUpdate
from app.api.deps import get_current_faculty

router = APIRouter()

@router.post("/{intern_id}", response_model=InternshipResponse)
async def create_internship(intern_id: UUID, internship: InternshipCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    # Check maximum intern limit
    count_result = await db.execute(select(func.count()).select_from(Internship).filter(Internship.faculty_id == current_user.faculty_id))
    if count_result.scalar() >= 5:
        raise HTTPException(status_code=400, detail="Faculty can only mentor a maximum of 5 interns.")

    internship_data = internship.model_dump()
    internship_data.pop("faculty_mentor", None)
    internship_data["faculty_id"] = current_user.faculty_id

    new_internship = Internship(
        intern_id=intern_id,
        **internship_data
    )
    db.add(new_internship)
    await db.commit()
    await db.refresh(new_internship)
    return new_internship

@router.get("/", response_model=List[InternshipResponse])
async def read_internships(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    query = select(Internship).options(
        joinedload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).join(Intern)
    
    if getattr(current_user, "role", "faculty") != "dean":
        query = query.filter(Internship.faculty_id == current_user.faculty_id)
    
    if search:
        query = query.filter(
            (Intern.intern_name.ilike(f"%{search}%")) |
            (Internship.internship_title.ilike(f"%{search}%")) |
            (Intern.college_name.ilike(f"%{search}%"))
        )
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.unique().scalars().all()

@router.get("/{internship_id}", response_model=InternshipResponse)
async def read_internship(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    result = await db.execute(select(Internship).options(
        joinedload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    internship = result.scalars().first()
    if internship is None:
        raise HTTPException(status_code=404, detail="Internship not found")
    if getattr(current_user, "role", "faculty") != "dean" and internship.faculty_id != current_user.faculty_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this internship")

    return internship

@router.put("/{internship_id}", response_model=InternshipResponse)
async def update_internship(internship_id: UUID, internship_update: InternshipUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    result = await db.execute(select(Internship).options(
        joinedload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    internship = result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    if getattr(current_user, "role", "faculty") != "dean" and internship.faculty_id != current_user.faculty_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this internship")
    
    update_data = internship_update.model_dump(exclude_unset=True)
    
    intern_email = update_data.pop("intern_email", None)
    if intern_email is not None:
        intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
        intern = intern_result.scalars().first()
        if intern:
            intern.email = intern_email

    update_data.pop("faculty_mentor", None)
    update_data.pop("faculty_id", None)

    for key, value in update_data.items():
        setattr(internship, key, value)
        
    await db.commit()
    await db.refresh(internship)
    return internship

@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_internship(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    if getattr(current_user, "role", "faculty") != "dean" and internship.faculty_id != current_user.faculty_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this internship")
    
    await db.delete(internship)
    await db.commit()
    return None