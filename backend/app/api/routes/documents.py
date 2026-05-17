from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
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
    file_location = f"uploads/{internship_id}_{document_type}_{file.filename}"
    async with aiofiles.open(file_location, "wb+") as file_object:
        await file_object.write(await file.read())
    new_doc = Document(internship_id=internship_id, document_type=document_type, file_path=file_location)
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)
    return new_doc