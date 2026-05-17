from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from uuid import UUID
import os
from datetime import datetime
import smtplib
from email.message import EmailMessage
import asyncio

from app.db.database import get_db
from app.models.certificate import Certificate
from app.models.internship import Internship
from app.models.intern import Intern
from app.schemas.certificate import CertificateResponse
from app.api.deps import get_current_faculty
from app.services.certificate_service import generate_certificate_pdf

router = APIRouter()

@router.post("/generate/{internship_id}", response_model=CertificateResponse)
async def generate_certificate(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
    intern = intern_result.scalars().first()
    
    file_name = f"{internship_id}_certificate.pdf"
    # Use forward slashes explicitly for web URL compatibility
    file_path = f"generated_certificates/{file_name}"
    
    cert_result = await db.execute(select(Certificate).filter(Certificate.internship_id == internship_id))
    cert = cert_result.scalars().first()
    
    if not cert:
        count_result = await db.execute(select(func.count()).select_from(Certificate))
        cert_count = count_result.scalar() + 1
        cert_number = f"IMS-{datetime.utcnow().year}-{cert_count:04d}"
        cert = Certificate(internship_id=internship_id, certificate_path=file_path, certificate_number=cert_number)
        db.add(cert)
        await db.commit()
        await db.refresh(cert)

    await asyncio.to_thread(
        generate_certificate_pdf,
        intern_name=intern.intern_name,
        college_name=intern.college_name,
        title=internship.internship_title,
        domain=internship.internship_domain,
        start_date=internship.start_date,
        end_date=internship.end_date,
        output_path=file_path,
        certificate_number=cert.certificate_number
    )
    
    return cert

def send_email_sync(sender_email, sender_password, msg):
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(sender_email, sender_password)
        smtp.send_message(msg)

@router.post("/email/{internship_id}")
async def email_certificate(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")

    cert_result = await db.execute(select(Certificate).filter(Certificate.internship_id == internship_id))
    certificate = cert_result.scalars().first()
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
    intern = intern_result.scalars().first()
    if not intern or not intern.email:
        raise HTTPException(status_code=400, detail="Intern does not have an email address set.")
        
    sender_email = os.getenv("SENDER_EMAIL", "keerthivasan.220722@gmail.com")
    sender_password = os.getenv("SENDER_PASSWORD")
    
    if not sender_password or sender_password == "your_app_password_here":
        raise HTTPException(status_code=500, detail="SENDER_PASSWORD environment variable not set. Unable to send emails.")
        
    msg = EmailMessage()
    msg['Subject'] = 'Internship Completion Certificate'
    msg['From'] = sender_email
    msg['To'] = intern.email
    msg.set_content(f"Dear {intern.intern_name},\n\nCongratulations on successfully completing your internship.\nPlease find attached your internship completion certificate.\n\nBest regards,\n{current_user.faculty_name}")
    
    cert_path = certificate.certificate_path
    
    def read_file():
        with open(cert_path, 'rb') as f:
            return f.read()
            
    cert_data = await asyncio.to_thread(read_file)
        
    msg.add_attachment(cert_data, maintype='application', subtype='pdf', filename=os.path.basename(cert_path))
    
    try:
        await asyncio.to_thread(send_email_sync, sender_email, sender_password, msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
        
    return {"message": "Email sent successfully"}