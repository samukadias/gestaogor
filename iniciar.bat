@echo off
title Gestão GOR - Iniciando...

echo ============================================
echo   Gestão GOR - Iniciando Aplicacao
echo ============================================
echo.

set "APP_DIR=%~dp0"

echo [1/2] Iniciando Backend (porta 3000)...
start "GestaoGOR - Backend" cmd /k "cd /d "%APP_DIR%server" && node index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend (porta 5173)...
start "GestaoGOR - Frontend" cmd /k "cd /d "%APP_DIR%" && npm run dev"

echo.
echo ============================================
echo   Aplicacao iniciada com sucesso!
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo ============================================
echo.
echo Pode fechar esta janela. Os servidores
echo continuarao rodando nas janelas abertas.
echo.
pause
