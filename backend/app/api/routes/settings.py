from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Dict
from app.db.database import get_db
from app.models.system_setting import SystemSetting
from app.api.deps import get_current_faculty

router = APIRouter()

@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SystemSetting))
    settings_list = result.scalars().all()
    return {setting.key: setting.value for setting in settings_list}

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
