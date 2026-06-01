from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from sqlalchemy import func
from uuid import UUID
import os
from datetime import datetime
import smtplib
from email.message import EmailMessage
import asyncio
import secrets

from app.db.database import get_db
from app.models.certificate import Certificate
from app.models.internship import Internship
from app.models.intern import Intern
from app.models.faculty import Faculty
from app.schemas.certificate import CertificateResponse
from app.api.deps import get_current_faculty
from app.services.certificate_service import generate_certificate_pdf

router = APIRouter()


async def _core_generate_certificate(internship_id: UUID, db: AsyncSession):
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise ValueError("Internship not found")
        
    intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
    intern = intern_result.scalars().first()
    
    faculty_result = await db.execute(select(Faculty).filter(Faculty.faculty_id == internship.faculty_id))
    faculty = faculty_result.scalars().first()
    mentor_name = faculty.faculty_name if faculty else "Assigned Faculty"
    
    from app.utils.filenames import get_faculty_prefix, get_internship_index, get_internship_year_suffix
    
    faculty_prefix = get_faculty_prefix(faculty.email) if faculty else "faculty"
    year_val = get_internship_year_suffix(internship.start_date)
    index_val = await get_internship_index(db, internship.faculty_id, internship.internship_id)
    
    file_name = f"{faculty_prefix}_interCert_{year_val}_{index_val:02d}.pdf"
    file_path = f"generated_certificates/{file_name}"
    
    cert_result = await db.execute(select(Certificate).filter(Certificate.internship_id == internship_id))
    cert = cert_result.scalars().first()
    
    certificate_id_to_fetch = None
    needs_commit = False
    if not cert:
        cert_number = f"NITT-{secrets.token_hex(6).upper()}"
        cert = Certificate(internship_id=internship_id, certificate_path=file_path, certificate_number=cert_number)
        db.add(cert)
        await db.flush()
        certificate_id_to_fetch = cert.certificate_id
        needs_commit = True
    else:
        certificate_id_to_fetch = cert.certificate_id
        if not cert.certificate_number or cert.certificate_number.startswith("IMS-"):
            cert.certificate_number = f"NITT-{secrets.token_hex(6).upper()}"
            needs_commit = True
        if cert.certificate_path != file_path:
            if cert.certificate_path and os.path.exists(cert.certificate_path):
                try:
                    os.remove(cert.certificate_path)
                except Exception as e:
                    print(f"Failed to delete old certificate file: {e}")
            cert.certificate_path = file_path
            needs_commit = True

    final_cert_number = cert.certificate_number

    if needs_commit:
        await db.commit()

    dean_result = await db.execute(select(Faculty).filter(Faculty.role == "dean"))
    dean = dean_result.scalars().first()
    dean_signature_path = dean.signature_path if dean else None

    await asyncio.to_thread(
        generate_certificate_pdf,
        intern_name=intern.intern_name,
        college_name=intern.college_name,
        title=internship.internship_title,
        domain=internship.internship_domain,
        start_date=internship.start_date,
        end_date=internship.end_date,
        output_path=file_path,
        certificate_number=final_cert_number,
        mentor_name=mentor_name,
        faculty_department=faculty.department if hasattr(faculty, 'department') else None,
        faculty_signature_path=faculty.signature_path if hasattr(faculty, 'signature_path') else None,
        dean_signature_path=dean_signature_path
    )
    
    result = await db.execute(
        select(Certificate)
        .options(
            joinedload(Certificate.internship).options(
                joinedload(Internship.intern),
                joinedload(Internship.faculty)
            )
        )
        .filter(Certificate.certificate_id == certificate_id_to_fetch)
    )
    
    final_cert = result.scalars().first()
    if not final_cert:
        raise ValueError("Failed to retrieve certificate after generation.")

    return final_cert

@router.post("/generate/{internship_id}", response_model=CertificateResponse)
async def generate_certificate(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    # Enforce payment and duration completion (Admins can bypass duration, but payment must be verified for all)
    if not getattr(internship, "is_paid", False):
        raise HTTPException(status_code=400, detail="Cannot generate certificate: Payment is not verified.")
        
    if internship.end_date > datetime.utcnow().date() and getattr(current_user, "role", "faculty") != 'admin':
        raise HTTPException(status_code=400, detail="Cannot generate certificate: Internship duration is not yet completed.")
    
    try:
        final_cert = await _core_generate_certificate(internship_id, db)
        return final_cert
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
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
        
    if not getattr(internship, "is_paid", False):
        raise HTTPException(status_code=400, detail="Cannot email certificate. Payment verification is pending.")
        
    from datetime import datetime
    if internship.end_date > datetime.utcnow().date():
        raise HTTPException(status_code=400, detail="Cannot email certificate. Internship duration is not yet completed.")

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
        
    internship.is_emailed = True
    db.add(internship)
    await db.commit()
        
    return {"message": "Email sent successfully"}

from fastapi.responses import FileResponse

@router.get("/verify/{certificate_number}")
async def verify_certificate(certificate_number: str, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can verify certificates.")
    # Public endpoint to verify a certificate by its unique ID
    cert_result = await db.execute(select(Certificate).filter(Certificate.certificate_number == certificate_number))
    cert = cert_result.scalars().first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Invalid Verification ID. Certificate not found.")
        
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == cert.internship_id))
    internship = internship_result.scalars().first()
    
    if not internship:
        raise HTTPException(status_code=404, detail="Internship record corrupted or not found.")
        
    intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
    intern = intern_result.scalars().first()
    
    faculty_result = await db.execute(select(Faculty).filter(Faculty.faculty_id == internship.faculty_id))
    faculty = faculty_result.scalars().first()
    
    return {
        "status": "valid",
        "certificate_number": cert.certificate_number,
        "intern_name": intern.intern_name,
        "college_name": intern.college_name,
        "project_title": internship.internship_title,
        "domain": internship.internship_domain,
        "start_date": internship.start_date.isoformat(),
        "end_date": internship.end_date.isoformat(),
        "mentor_name": faculty.faculty_name if faculty else "Assigned Faculty",
        "generated_at": cert.generated_at.isoformat()
    }

@router.get("/view/{internship_id}")
async def view_certificate(internship_id: UUID, db: AsyncSession = Depends(get_db)):
    # This route doesn't require authentication so it can be viewed easily in a new tab
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    cert_result = await db.execute(select(Certificate).filter(Certificate.internship_id == internship_id))
    cert = cert_result.scalars().first()
    
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate record not found for this internship")
        
    faculty_result = await db.execute(select(Faculty).filter(Faculty.faculty_id == internship.faculty_id))
    faculty = faculty_result.scalars().first()
    
    # Compute the expected new file path format
    from app.utils.filenames import get_faculty_prefix, get_internship_index, get_internship_year_suffix
    faculty_prefix = get_faculty_prefix(faculty.email) if faculty else "faculty"
    year_val = get_internship_year_suffix(internship.start_date)
    index_val = await get_internship_index(db, internship.faculty_id, internship.internship_id)
    expected_file_name = f"{faculty_prefix}_interCert_{year_val}_{index_val:02d}.pdf"
    expected_file_path = f"generated_certificates/{expected_file_name}"
    
    needs_generation = False
    
    # Upgrade legacy path to new naming convention
    if cert.certificate_path != expected_file_path:
        if cert.certificate_path and os.path.exists(cert.certificate_path):
            try:
                os.remove(cert.certificate_path)
            except Exception as e:
                print(f"Failed to delete old certificate file: {e}")
        cert.certificate_path = expected_file_path
        await db.commit()
        needs_generation = True
        
    if not os.path.exists(cert.certificate_path):
        needs_generation = True
        
    if needs_generation:
        # File is missing or path was upgraded. Generate it on the fly!
        intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
        intern = intern_result.scalars().first()
        
        mentor_name = faculty.faculty_name if faculty else "Assigned Faculty"
        
        # Query Dean signature
        dean_res = await db.execute(select(Faculty).filter(Faculty.role == "dean"))
        dean = dean_res.scalars().first()
        dean_signature_path = dean.signature_path if dean else None
        
        await asyncio.to_thread(
            generate_certificate_pdf,
            intern_name=intern.intern_name,
            college_name=intern.college_name,
            title=internship.internship_title,
            domain=internship.internship_domain,
            start_date=internship.start_date,
            end_date=internship.end_date,
            output_path=cert.certificate_path,
            certificate_number=cert.certificate_number,
            mentor_name=mentor_name,
            faculty_department=faculty.department if hasattr(faculty, 'department') else None,
            faculty_signature_path=faculty.signature_path if hasattr(faculty, 'signature_path') else None,
            dean_signature_path=dean_signature_path
        )
        
    # Fetch the intern to use their name for the downloaded file
    intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
    intern = intern_result.scalars().first()
    safe_name = intern.intern_name.replace(" ", "_") if intern else "Student"
    
    return FileResponse(
        cert.certificate_path,
        media_type="application/pdf",
        filename=f"{safe_name}_Certificate.pdf",
        content_disposition_type="inline" # Inline so it opens in the browser natively
    )

@router.get("/preview/{internship_id}")
async def preview_certificate(internship_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    internship_result = await db.execute(select(Internship).filter(Internship.internship_id == internship_id))
    internship = internship_result.scalars().first()
    if not internship:
        raise HTTPException(status_code=404, detail="Internship not found")
    
    intern_result = await db.execute(select(Intern).filter(Intern.intern_id == internship.intern_id))
    intern = intern_result.scalars().first()
    if not intern:
        raise HTTPException(status_code=404, detail="Intern not found")
        
    faculty_result = await db.execute(select(Faculty).filter(Faculty.faculty_id == internship.faculty_id))
    faculty = faculty_result.scalars().first()
    mentor_name = faculty.faculty_name if faculty else "Assigned Faculty"
        
    temp_dir = "temp_previews"
    os.makedirs(temp_dir, exist_ok=True)
    preview_file = f"{temp_dir}/{internship_id}_preview.pdf"
    
    # Query Dean signature
    dean_res = await db.execute(select(Faculty).filter(Faculty.role == "dean"))
    dean = dean_res.scalars().first()
    dean_signature_path = dean.signature_path if dean else None

    await asyncio.to_thread(
        generate_certificate_pdf,
        intern_name=intern.intern_name,
        college_name=intern.college_name,
        title=internship.internship_title,
        domain=internship.internship_domain,
        start_date=internship.start_date,
        end_date=internship.end_date,
        output_path=preview_file,
        certificate_number="NITT-PREVIEW-TEMP",
        mentor_name=mentor_name,
        faculty_department=faculty.department if hasattr(faculty, 'department') else None,
        faculty_signature_path=faculty.signature_path if hasattr(faculty, 'signature_path') else None,
        dean_signature_path=dean_signature_path
    )
    
    return FileResponse(
        preview_file, 
        media_type="application/pdf", 
        filename=f"Preview_{intern.intern_name.replace(' ', '_')}_Certificate.pdf",
        content_disposition_type="inline"
    )
import io
import zipfile
from fastapi.responses import StreamingResponse

@router.get("/bulk-download")
async def bulk_download_certificates(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_faculty)):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can bulk download certificates.")
        
    result = await db.execute(
        select(Certificate)
        .join(Internship)
        .filter(Internship.is_paid == True, Internship.end_date <= datetime.utcnow().date())
    )
    certificates = result.scalars().all()
    
    if not certificates:
        raise HTTPException(status_code=404, detail="No eligible certificates found for download.")
        
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for cert in certificates:
            if cert.certificate_path and os.path.exists(cert.certificate_path):
                # Ensure a clean filename inside the zip
                filename = os.path.basename(cert.certificate_path)
                zip_file.write(cert.certificate_path, arcname=filename)
                
    zip_buffer.seek(0)
    
    from datetime import datetime as dt
    date_str = dt.now().strftime("%Y-%m-%d")
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=Bulk_Certificates_{date_str}.zip"}
    )
