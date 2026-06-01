import asyncio
from app.db.database import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        await conn.execute(text('ALTER TABLE faculties ADD COLUMN IF NOT EXISTS department VARCHAR'))
    print('Done')

if __name__ == '__main__':
    asyncio.run(run())
