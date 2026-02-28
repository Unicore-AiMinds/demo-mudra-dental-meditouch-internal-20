@echo off
REM Mudra Clinic — Build Installer Script
REM Prerequisites:
REM   1. Node.js installed (for npm run build)
REM   2. Inno Setup 6 installed (default path)
REM   3. Portable node.exe in installer\ folder
REM   4. mudra-icon.ico in installer\ folder

echo ============================================
echo   Mudra Clinic — Installer Build
echo ============================================
echo.

REM Navigate to project root
cd /d "%~dp0.."

REM Step 1: Build the React app
echo [1/3] Building React app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm run build failed!
    pause
    exit /b 1
)
echo       Build complete. dist\ folder ready.
echo.

REM Step 2: Check prerequisites
echo [2/3] Checking prerequisites...

if not exist "installer\node.exe" (
    echo ERROR: installer\node.exe not found!
    echo Download portable Node.js from:
    echo   https://nodejs.org/dist/v20.18.0/win-x64/node.exe
    echo Place it in the installer\ folder.
    pause
    exit /b 1
)
echo       node.exe found.

if not exist "installer\mudra-icon.ico" (
    echo WARNING: installer\mudra-icon.ico not found!
    echo The installer will fail without an icon file.
    echo Convert your logo.png to .ico format and place it in installer\
    pause
    exit /b 1
)
echo       mudra-icon.ico found.

if not exist "dist\index.html" (
    echo ERROR: dist\index.html not found! Build may have failed.
    pause
    exit /b 1
)
echo       dist\ folder verified.
echo.

REM Step 3: Compile Inno Setup installer
echo [3/3] Compiling installer with Inno Setup...

set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist %ISCC% (
    set ISCC="C:\Program Files\Inno Setup 6\ISCC.exe"
)
if not exist %ISCC% (
    echo ERROR: Inno Setup 6 not found!
    echo Install from: https://jrsoftware.org/isdl.php
    pause
    exit /b 1
)

%ISCC% installer\mudra-setup.iss
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Inno Setup compilation failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD COMPLETE!
echo   Installer: installer\Output\MudraClinicSetup.exe
echo ============================================
echo.
pause
