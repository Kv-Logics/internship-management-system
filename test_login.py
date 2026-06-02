
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import urllib.request, json

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5432/nitt_ims')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(text("SELECT code FROM otps WHERE email='114123003@nitt.edu'"))
        code = result.scalar()
        print('Got code:', code)
        
        data = json.dumps({'email': '114123003@nitt.edu', 'otp': code}).encode('utf-8')
        req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login', data=data, headers={'Content-Type': 'application/json'})
        try:
            res = urllib.request.urlopen(req)
            print('Login successful', res.read().decode('utf-8'))
        except Exception as e:
            print(e)
            print(e.read().decode('utf-8'))

asyncio.run(main())

