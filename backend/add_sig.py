import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

async def add_column():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE faculties ADD COLUMN signature_path VARCHAR;"))
            print("Successfully added signature_path to faculties table.")
        except Exception as e:
            print("Note (or error):", e)

from sqlalchemy import text
if __name__ == "__main__":
    asyncio.run(add_column())
