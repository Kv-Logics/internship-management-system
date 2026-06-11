import asyncio
import os
import sys

# Ensure backend root is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from sqlalchemy import text

async def reset_emails():
    print("Connecting to the database...")
    async with engine.begin() as conn:
        print("Resetting is_emailed status for all internships...")
        result = await conn.execute(text("UPDATE internships SET is_emailed = FALSE;"))
        print(f"Update completed successfully! Rows affected: {result.rowcount}")

if __name__ == "__main__":
    asyncio.run(reset_emails())
