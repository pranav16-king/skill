@echo off
title DPDP Form Auditor - Dual Stack Launcher
echo ==========================================================
echo  Starting DPDP Form Auditor (Backend + Frontend)
echo ==========================================================

echo [1/2] Launching Python FastAPI Backend at http://127.0.0.1:8000...
start "DPDP Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching React TSX Frontend at http://localhost:5173...
start "DPDP Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul
echo ==========================================================
echo  Services launched in separate windows!
echo  - Frontend: http://localhost:5173
echo  - Backend Docs: http://127.0.0.1:8000/docs
echo  - Standalone: %~dp0index.html
echo ==========================================================
pause
