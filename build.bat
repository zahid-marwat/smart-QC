@echo off
echo Building Smart QC Application for Windows...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Build React app
echo Building React application...
npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build React application
    pause
    exit /b 1
)

REM Build Electron app
echo Building Electron application...
npm run electron-pack
if %errorlevel% neq 0 (
    echo Error: Failed to build Electron application
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Executable can be found in the 'dist' folder.
echo.
pause
