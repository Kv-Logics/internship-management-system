from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import joinedload, selectinload

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

    # Query system settings
    from app.models.system_setting import SystemSetting
    from datetime import datetime
    settings_res = await db.execute(select(SystemSetting))
    settings = {s.key: s.value for s in settings_res.scalars().all()}
    
    max_faculty_students = int(settings.get("max_students_per_faculty", "5"))
    max_year_students = int(settings.get("max_students_per_year", "100"))
    min_days = int(settings.get("min_duration_days", "28"))
    project_start_str = settings.get("project_start_date", "2026-05-18")
    project_end_str = settings.get("project_end_date", "2026-07-31")

    # Check maximum intern limit per faculty
    count_result = await db.execute(select(func.count()).select_from(Internship).filter(Internship.faculty_id == target_faculty_id))
    if count_result.scalar() >= max_faculty_students:
        raise HTTPException(
            status_code=400,
            detail=f"The chosen faculty mentor has already reached the maximum limit of {max_faculty_students} interns."
        )

    # Check internship project period boundaries
    p_start = datetime.strptime(project_start_str, "%Y-%m-%d").date()
    p_end = datetime.strptime(project_end_str, "%Y-%m-%d").date()
    if internship.start_date < p_start:
        raise HTTPException(
            status_code=400,
            detail=f"Internship start date must be on or after the academic year start date of {project_start_str}."
        )
    if internship.end_date > p_end:
        raise HTTPException(
            status_code=400,
            detail=f"Internship end date must be on or before the academic year end date of {project_end_str}."
        )

    # Check minimum duration
    duration = (internship.end_date - internship.start_date).days
    if duration < min_days:
        raise HTTPException(
            status_code=400,
            detail=f"Internship duration must be at least {min_days} days."
        )

    internship_data = internship.model_dump()
    internship_data.pop("faculty_mentor", None)
    internship_data.pop("faculty_id", None)
    if getattr(current_user, "role", "faculty") != "admin":
        internship_data["is_paid"] = False

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
        selectinload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    
    return result.scalars().first()

@router.get("/", response_model=List[InternshipResponse])
async def read_internships(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    from app.models.faculty import Faculty
    query = select(Internship).options(
        selectinload(Internship.documents),
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
        selectinload(Internship.documents),
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
        selectinload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    internship = result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    if getattr(current_user, "role", "faculty") not in ("dean", "admin") and internship.faculty_id != current_user.faculty_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this internship")
    
    # Check allow_faculty_edit system setting if the current user is a regular faculty member
    if getattr(current_user, "role", "faculty") not in ("dean", "admin"):
        from app.models.system_setting import SystemSetting
        settings_res = await db.execute(select(SystemSetting).filter(SystemSetting.key == "allow_faculty_edit"))
        allow_edit_setting = settings_res.scalars().first()
        if allow_edit_setting and allow_edit_setting.value == "false":
            raise HTTPException(
                status_code=403,
                detail="Faculties are currently restricted from editing records by the administrator."
            )
            
    update_data = internship_update.model_dump(exclude_unset=True)
    if getattr(current_user, "role", "faculty") != "admin":
        update_data.pop("is_paid", None)
    
    # Query system settings
    from app.models.system_setting import SystemSetting
    from datetime import datetime, date
    settings_res = await db.execute(select(SystemSetting))
    settings = {s.key: s.value for s in settings_res.scalars().all()}
    
    max_faculty_students = int(settings.get("max_students_per_faculty", "5"))
    min_days = int(settings.get("min_duration_days", "28"))
    project_start_str = settings.get("project_start_date", "2026-05-18")
    project_end_str = settings.get("project_end_date", "2026-07-31")

    # Helper function to normalize date formats
    def to_date_obj(val):
        if isinstance(val, (date, datetime)):
            return val if isinstance(val, date) else val.date()
        return datetime.strptime(str(val), "%Y-%m-%d").date()

    # Validate dates if updated
    new_start = update_data.get("start_date", internship.start_date)
    new_end = update_data.get("end_date", internship.end_date)
    if new_start is not None and new_end is not None:
        start_dt = to_date_obj(new_start)
        end_dt = to_date_obj(new_end)
        
        p_start = datetime.strptime(project_start_str, "%Y-%m-%d").date()
        p_end = datetime.strptime(project_end_str, "%Y-%m-%d").date()
        
        if start_dt < p_start:
            raise HTTPException(
                status_code=400,
                detail=f"Internship start date must be on or after the academic year start date of {project_start_str}."
            )
        if end_dt > p_end:
            raise HTTPException(
                status_code=400,
                detail=f"Internship end date must be on or before the academic year end date of {project_end_str}."
            )
            
        duration = (end_dt - start_dt).days
        if duration < min_days:
            raise HTTPException(
                status_code=400,
                detail=f"Internship duration must be at least {min_days} days."
            )
    
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
        selectinload(Internship.documents),
        joinedload(Internship.certificate),
        joinedload(Internship.intern),
        joinedload(Internship.faculty)
    ).filter(Internship.internship_id == internship_id))
    updated_internship = result.scalars().first()
    
    # Automatically regenerate the certificate PDF if it already exists to reflect the edits
    if updated_internship and updated_internship.certificate:
        from app.services.certificate_service import generate_certificate_pdf
        from app.models.faculty import Faculty
        import asyncio
        mentor_name = updated_internship.faculty.faculty_name if updated_internship.faculty else "Assigned Faculty"
        
        dean_result = await db.execute(select(Faculty).filter(Faculty.role == "dean"))
        dean = dean_result.scalars().first()
        
        await asyncio.to_thread(
            generate_certificate_pdf,
            intern_name=updated_internship.intern.intern_name,
            college_name=updated_internship.intern.college_name,
            title=updated_internship.internship_title,
            domain=updated_internship.internship_domain,
            start_date=updated_internship.start_date,
            end_date=updated_internship.end_date,
            output_path=updated_internship.certificate.certificate_path,
            certificate_number=updated_internship.certificate.certificate_number,
            mentor_name=mentor_name,
            faculty_signature_path=updated_internship.faculty.signature_path if hasattr(updated_internship.faculty, 'signature_path') else None,
            dean_signature_path=dean.signature_path if dean else None
        )
    elif updated_internship and getattr(updated_internship, "is_paid", False) and updated_internship.end_date <= datetime.utcnow().date():
        # Auto-generate if eligible and no certificate exists yet
        try:
            from app.api.routes.certificates import _core_generate_certificate
            await _core_generate_certificate(updated_internship.internship_id, db)
        except Exception as e:
            print(f"Failed to auto-generate certificate: {e}")

    return updated_internship

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