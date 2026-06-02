# This script starts the IMS Backend (port 8000) and IMS Frontend (port 3000) in separate PowerShell windows.

# 1. IMS Backend (Port 8000)
Write-Host "Starting IMS Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\keert\NIT Projects\internship-management-system\backend'; .\venv\Scripts\uvicorn app.main:app --reload --port 8000"

# 2. IMS Frontend (Port 3000)
Write-Host "Starting IMS Frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\keert\NIT Projects\internship-management-system\frontend'; npm run dev"

Write-Host "IMS Backend and Frontend started in separate windows!" -ForegroundColor Green
