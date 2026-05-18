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
    target_faculty_id = current_user.faculty_id
    
    if current_user.role in ("admin", "dean") and internship.faculty_id is not None:
        target_faculty_id = internship.faculty_id

    # Check maximum intern limit
    count_result = await db.execute(select(func.count()).select_from(Internship).filter(Internship.faculty_id == target_faculty_id))
    if count_result.scalar() >= 5:
        raise HTTPException(status_code=400, detail="The chosen faculty mentor has already reached the maximum limit of 5 interns.")

    internship_data = internship.model_dump()
    internship_data.pop("faculty_mentor", None)
    internship_data.pop("faculty_id", None)

    new_internship = Internship(
        intern_id=intern_id,
        faculty_id=target_faculty_id,
        **internship_data
    )
    db.add(new_internship)
    await db.flush()
    internship_id = new_internship.internship_id
    await db.commit()
    
    # Fetch the newly created internship with relationships eagerly loaded to prevent MissingGreenlet error
    result = await db.execute(select(Internship).options(
        joinedload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    
    return result.scalars().first()

@router.get("/", response_model=List[InternshipResponse])
async def read_internships(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    from app.models.faculty import Faculty
    query = select(Internship).options(
        joinedload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).join(Intern).join(Faculty, isouter=True)
    
    if getattr(current_user, "role", "faculty") not in ("dean", "admin"):
        query = query.filter(Internship.faculty_id == current_user.faculty_id)
    
    if search:
        query = query.filter(
            (Intern.intern_name.ilike(f"%{search}%")) |
            (Internship.internship_title.ilike(f"%{search}%")) |
            (Intern.college_name.ilike(f"%{search}%")) |
            (Faculty.faculty_name.ilike(f"%{search}%"))
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
    if getattr(current_user, "role", "faculty") not in ("dean", "admin") and internship.faculty_id != current_user.faculty_id:
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
    if getattr(current_user, "role", "faculty") not in ("dean", "admin") and internship.faculty_id != current_user.faculty_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this internship")
    
    update_data = internship_update.model_dump(exclude_unset=True)
    
    intern_email = update_data.pop("intern_email", None)
    intern_name = update_data.pop("intern_name", None)
    intern_phone = update_data.pop("intern_phone", None)
    college_name = update_data.pop("college_name", None)
    department = update_data.pop("department", None)
    
    if any(x is not None for x in (intern_email, intern_name, intern_phone, college_name, department)):
        intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
        intern = intern_result.scalars().first()
        if intern:
            if intern_email is not None:
                intern.email = intern_email
            if intern_name is not None:
                intern.intern_name = intern_name
            if intern_phone is not None:
                intern.phone = intern_phone
            if college_name is not None:
                intern.college_name = college_name
            if department is not None:
                intern.department = department

    update_data.pop("faculty_mentor", None)
    update_data.pop("faculty_id", None)

    for key, value in update_data.items():
        setattr(internship, key, value)
        
    await db.commit()
    
    # Re-fetch the updated internship with relationships eagerly loaded
    result = await db.execute(select(Internship).options(
        joinedload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    return result.scalars().first()

@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_internship(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    if getattr(current_user, "role", "faculty") not in ("dean", "admin") and internship.faculty_id != current_user.faculty_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this internship")
    
    await db.delete(internship)
    await db.commit()
    return None