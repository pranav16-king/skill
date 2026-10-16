@echo off
setlocal enabledelayedexpansion

echo ========================================================================
echo                 DPDP FORM AUDITOR - SETUP SCRIPT                        
echo        Digital Personal Data Protection Act, 2023 Compliance           
echo ========================================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Python environment...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)
python --version

echo.
echo [2/4] Installing backend dependencies...
cd backend
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Some dependencies failed to install. Continuing...
)
cd ..

echo.
echo [3/4] Checking Node.js environment and installing frontend dependencies...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH. Please install Node 18+.
    pause
    exit /b 1
)
node --version

cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [WARNING] npm install reported issues.
)

echo.
echo [4/4] Building production frontend bundles...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Production build failed. Vite development server will still work.
) else (
    echo [SUCCESS] Frontend bundle built cleanly.
)
cd ..

echo.
echo ========================================================================
echo                 SETUP COMPLETE! READY TO LAUNCH                        
echo ========================================================================
echo Run one of the following to start:
echo   - PowerShell: .\start.ps1
echo   - Python:     python run_all.py
echo   - Backend:    cd backend ^&^& python -m uvicorn app.main:app --port 8000 --reload
echo   - Frontend:   cd frontend ^&^& npm run dev
echo.
pause
