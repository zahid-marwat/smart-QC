@echo off
echo Starting Smart QC Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

REM Install frontend dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

REM Setup Python backend
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo Error: Failed to install Python dependencies
        pause
        exit /b 1
    )
    cd ..
)

REM Start the application
echo.
echo Starting Smart QC Application...
echo Frontend will start on http://localhost:3000
echo Backend will start on http://localhost:5000
echo.

start "Smart QC Backend" cmd /k "cd backend && venv\Scripts\activate && python app.py"
timeout /t 3 /nobreak > nul
npm run electron-dev

pause
