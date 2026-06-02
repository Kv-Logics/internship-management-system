import os
import smtplib
import asyncio
import logging
from email.message import EmailMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system_setting import SystemSetting

logger = logging.getLogger(__name__)

async def send_email_with_settings(db: AsyncSession, msg: EmailMessage):
    # Fetch SMTP settings from DB
    keys = ["smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_secure"]
    stmt = select(SystemSetting).filter(SystemSetting.key.in_(keys))
    result = await db.execute(stmt)
    settings = {s.key: s.value for s in result.scalars().all()}
    
    smtp_host = settings.get("smtp_host") or os.getenv("SMTP_HOST")
    smtp_port = settings.get("smtp_port") or os.getenv("SMTP_PORT")
    smtp_username = settings.get("smtp_username") or os.getenv("SMTP_USERNAME")
    smtp_password = settings.get("smtp_password") or os.getenv("SMTP_PASSWORD")
    smtp_secure = settings.get("smtp_secure") or os.getenv("SMTP_SECURE", "ssl") # "ssl", "tls", or "none"
    
    # Ensure SMTP settings are configured in database or environment
    if not smtp_host or not smtp_username or not smtp_password:
        raise ValueError("SMTP mail credentials are not configured in the database nor in the .env file. System cannot send emails.")
        
    port = int(smtp_port) if smtp_port and smtp_port.isdigit() else 465
    
    # Ensure From header is set
    if 'From' not in msg:
        msg['From'] = smtp_username
        
    def _send():
        if smtp_secure == "ssl":
            with smtplib.SMTP_SSL(smtp_host, port, timeout=2.0) as smtp:
                if smtp_username and smtp_password:
                    smtp.login(smtp_username, smtp_password)
                smtp.send_message(msg)
        elif smtp_secure == "tls":
            with smtplib.SMTP(smtp_host, port, timeout=2.0) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.ehlo()
                if smtp_username and smtp_password:
                    smtp.login(smtp_username, smtp_password)
                smtp.send_message(msg)
        else: # none
            with smtplib.SMTP(smtp_host, port, timeout=2.0) as smtp:
                if smtp_username and smtp_password:
                    smtp.login(smtp_username, smtp_password)
                smtp.send_message(msg)
                
    await asyncio.to_thread(_send)
