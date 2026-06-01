# This script starts all 4 servers (SSO Backend, SSO Frontend, IMS Backend, IMS Frontend) in separate PowerShell windows.

# 1. SSO Backend (Port 5000)
Write-Host "Starting NITT SSO Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\keert\NIT Projects\nitt_auth\backend'; npm run dev"

# 2. SSO Frontend (Port 5001)
Write-Host "Starting NITT SSO Frontend on port 5001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\keert\NIT Projects\nitt_auth\frontend'; npm run dev"

# 3. IMS Backend (Port 8000)
Write-Host "Starting IMS Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\keert\NIT Projects\internship-management-system\backend'; .\venv\Scripts\uvicorn app.main:app --reload --port 8000"

# 4. IMS Frontend (Port 3000)
Write-Host "Starting IMS Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\keert\NIT Projects\internship-management-system\frontend'; npm run dev"

Write-Host "All 4 servers started in separate windows!" -ForegroundColor Green
