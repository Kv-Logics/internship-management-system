from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Dict
from pydantic import BaseModel
from app.db.database import get_db
from app.models.system_setting import SystemSetting
from app.api.deps import get_current_faculty

router = APIRouter()

@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemSetting))
    settings_list = result.scalars().all()
    # Exclude sensitive SMTP settings from public endpoint
    return {setting.key: setting.value for setting in settings_list if not setting.key.startswith("smtp_")}

import os
@router.get("/departments")
async def get_departments():
    # Path to CSV in root folder
    csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "departments_list.csv"))
    if not os.path.exists(csv_path):
        return []
    
    depts = []
    with open(csv_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        for line in lines[1:]: # Skip header
            clean = line.strip().replace('"', '')
            if clean:
                depts.append(clean)
    return depts

@router.put("/")
async def update_settings(
    settings_data: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify system settings."
        )
    
    for key, value in settings_data.items():
        # Validate values
        if key in ("project_start_date", "project_end_date"):
            # Check format is YYYY-MM-DD
            from datetime import datetime
            try:
                datetime.strptime(value, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid date format for {key}. Expected YYYY-MM-DD."
                )
        elif key in ("min_duration_days", "max_students_per_faculty", "max_students_per_year"):
            if not value.isdigit() or int(value) <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Value for {key} must be a positive integer."
                )

        result = await db.execute(select(SystemSetting).filter(SystemSetting.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = value
        else:
            new_setting = SystemSetting(key=key, value=value)
            db.add(new_setting)
            
    await db.commit()
    return {"message": "Settings updated successfully"}

class SmtpSettingsSchema(BaseModel):
    smtp_host: str = ""
    smtp_port: str = ""
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_secure: str = "ssl" # ssl, tls, none

class TestEmailSchema(BaseModel):
    recipient_email: str

@router.get("/smtp")
async def get_smtp_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can access SMTP settings.")
    
    keys = ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_secure"]
    result = await db.execute(select(SystemSetting).filter(SystemSetting.key.in_(keys)))
    settings_dict = {setting.key: setting.value for setting in result.scalars().all()}
    
    has_password = "smtp_password" in settings_dict and bool(settings_dict["smtp_password"])
    
    return {
        "smtp_host": settings_dict.get("smtp_host", ""),
        "smtp_port": settings_dict.get("smtp_port", ""),
        "smtp_username": settings_dict.get("smtp_username", ""),
        "smtp_secure": settings_dict.get("smtp_secure", "ssl"),
        "has_password": has_password
    }

@router.put("/smtp")
async def update_smtp_settings(
    data: SmtpSettingsSchema,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can modify SMTP settings.")
        
    settings_to_update = {
        "smtp_host": data.smtp_host,
        "smtp_port": data.smtp_port,
        "smtp_username": data.smtp_username,
        "smtp_secure": data.smtp_secure
    }
    
    # Only update password if a new one is supplied and it's not the masked value or empty
    if data.smtp_password and data.smtp_password != "********":
        settings_to_update["smtp_password"] = data.smtp_password

    for key, value in settings_to_update.items():
        result = await db.execute(select(SystemSetting).filter(SystemSetting.key == key))
        setting = result.scalars().first()
        if setting:
            setting.value = str(value)
        else:
            db.add(SystemSetting(key=key, value=str(value)))
            
    await db.commit()
    return {"message": "SMTP settings updated successfully"}

@router.post("/smtp/test")
async def test_smtp_settings(
    data: TestEmailSchema,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can perform SMTP test.")
        
    from app.utils.email import send_email_with_settings
    from email.message import EmailMessage
    
    msg = EmailMessage()
    msg['Subject'] = 'IMS SMTP Configuration Test'
    msg['To'] = data.recipient_email
    msg.set_content(
        f"Hello,\n\n"
        f"This is a test email from the Internship Management System (IMS).\n"
        f"If you received this, your SMTP settings are configured correctly!\n\n"
        f"Best regards,\n"
        f"IMS System Admin"
    )
    
    try:
        await send_email_with_settings(db, msg)
        return {"message": f"Test email sent successfully to {data.recipient_email}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to send email: {str(e)}")

@router.delete("/smtp")
async def reset_smtp_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_faculty)
):
    if getattr(current_user, "role", "faculty") != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can reset SMTP settings.")
        
    keys = ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_secure"]
    for key in keys:
        result = await db.execute(select(SystemSetting).filter(SystemSetting.key == key))
        setting = result.scalars().first()
        if setting:
            await db.delete(setting)
            
    await db.commit()
    return {"message": "SMTP settings reset successfully"}


