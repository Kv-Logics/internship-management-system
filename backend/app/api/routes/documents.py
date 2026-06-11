from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import os
import aiofiles

from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_faculty

router = APIRouter()

@router.post("/upload/{internship_id}", response_model=DocumentResponse)
async def upload_document(
    internship_id: UUID,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    # Sanitize filename to prevent path traversal (e.g. ../../etc/passwd)
    safe_filename = os.path.basename(file.filename).replace("..", "").strip()
    if not safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    # Extension validation to prevent arbitrary uploads (e.g., PHP, JS, executable scripts)
    ext = os.path.splitext(safe_filename)[1].lower()
    if ext not in (".pdf", ".doc", ".docx"):
        raise HTTPException(status_code=400, detail="Forbidden file type. Only PDF, DOC, and DOCX files are allowed.")

    # Fetch internship to compute index and faculty prefix
    from app.models.internship import Internship
    from app.models.faculty import Faculty
    from app.utils.filenames import get_faculty_prefix, get_internship_index, get_internship_year_suffix

    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    faculty_result = await db.execute(select(Faculty).filter(Faculty.faculty_id == internship.faculty_id))
    faculty = faculty_result.scalars().first()

    target_dir = "uploads/reports" if document_type == "report" else "uploads"
    os.makedirs(target_dir, exist_ok=True)

    if document_type == "report":
        faculty_prefix = get_faculty_prefix(faculty.email) if faculty else "faculty"
        year_val = get_internship_year_suffix(internship.start_date)
        index_val = await get_internship_index(db, internship.faculty_id, internship.internship_id)
        ext = os.path.splitext(safe_filename)[1]
        file_name = f"{faculty_prefix}_internReport_{year_val}_{index_val:02d}{ext}"
    else:
        file_name = f"{internship_id}_{document_type}_{safe_filename}"

    file_location = f"{target_dir}/{file_name}".replace("\\", "/")
    
    # Check if a document of the same type already exists for this internship
    stmt = select(Document).filter(
        Document.internship_id == internship_id,
        Document.document_type == document_type
    )
    existing_doc_res = await db.execute(stmt)
    existing_doc = existing_doc_res.scalars().first()
    
    if existing_doc:
        # Delete old file from disk
        if os.path.exists(existing_doc.file_path):
            try:
                os.remove(existing_doc.file_path)
            except Exception as e:
                print(f"Failed to delete old file: {e}")
        # Delete DB record
        await db.delete(existing_doc)
        await db.flush()
        
    async with aiofiles.open(file_location, "wb+") as file_object:
        await file_object.write(await file.read())
    new_doc = Document(internship_id=internship_id, document_type=document_type, file_path=file_location)
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc