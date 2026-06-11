import os
import smtplib
import asyncio
import logging
from email.message import EmailMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system_setting import SystemSetting

logger = logging.getLogger(__name__)

async def send_email_with_settings(db: AsyncSession, msg: EmailMessage, use_env_only: bool = False):
    if use_env_only:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = os.getenv("SMTP_PORT")
        smtp_username = os.getenv("SMTP_USERNAME")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_secure = os.getenv("SMTP_SECURE", "ssl")
    else:
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
    
    from email.utils import make_msgid, formatdate

    # Ensure standard headers are set to prevent strict filters (like Gmail) from dropping it
    import ssl
    # Ensure From header is set properly, appending domain if it's just a username prefix
    if 'From' not in msg:
        if "@" not in smtp_username:
            msg['From'] = f"{smtp_username}@nitt.edu"
        else:
            msg['From'] = smtp_username
            
    if 'Date' not in msg:
        msg['Date'] = formatdate(localtime=True)
    if 'Message-ID' not in msg:
        msg['Message-ID'] = make_msgid(domain="nitt.edu")
        
    def _send():
        logger.info("=== DEBUG: Raw Email Payload ===")
        logger.info(msg.as_string())
        logger.info("================================")
        
        # Create an unverified SSL context to match PHP's verify_peer=false
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        if smtp_secure == "ssl":
            with smtplib.SMTP_SSL(smtp_host, port, timeout=15.0, context=ssl_context) as smtp:
                smtp.set_debuglevel(1)
                if smtp_username and smtp_password:
                    smtp.login(smtp_username, smtp_password)
                result = smtp.send_message(msg)
                logger.info(f"SMTP send_message result: {result}")
        elif smtp_secure == "tls":
            with smtplib.SMTP(smtp_host, port, timeout=15.0) as smtp:
                smtp.set_debuglevel(1)
                smtp.ehlo()
                smtp.starttls(context=ssl_context)
                smtp.ehlo()
                if smtp_username and smtp_password:
                    smtp.login(smtp_username, smtp_password)
                result = smtp.send_message(msg)
                logger.info(f"SMTP send_message result: {result}")
        else: # none
            with smtplib.SMTP(smtp_host, port, timeout=2.0) as smtp:
                smtp.set_debuglevel(1)
                if smtp_username and smtp_password:
                    smtp.login(smtp_username, smtp_password)
                result = smtp.send_message(msg)
                logger.info(f"SMTP send_message result: {result}")
                
    await asyncio.to_thread(_send)
