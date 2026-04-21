@echo off
title PreUni App - Local Server
echo ==========================================
echo    INICIANDO APP PREUNIVERSITARIA
echo ==========================================
echo.

cd /d "%~dp0"

if not exist ".env" (
    echo [ERROR] No encuentro el archivo .env
    echo Por favor, crea un archivo .env con tus credenciales de Supabase.
    echo Revisa el archivo .env.example como guia.
    echo.
    pause
    exit /b
)

if not exist "node_modules\" (
    echo [INFO] Instalando dependencias necesarias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Hubo un problema instalando las dependencias.
        pause
        exit /b
      )
)

echo [INFO] Iniciando el servidor de desarrollo...
echo Accede a: http://localhost:5173
echo.
call npm run dev
pause
