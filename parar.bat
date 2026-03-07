@echo off
title FluxoProd - Parando Aplicacao

echo ============================================
echo   FluxoProd - Parando Aplicacao
echo ============================================
echo.

echo Parando processos node.js...
taskkill /F /FI "WINDOWTITLE eq FluxoProd - Backend" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq FluxoProd - Frontend" /T >nul 2>&1

echo Encerrando processos node na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find "3000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo Encerrando processos node na porta 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| find "5173" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo.
echo Aplicacao encerrada.
timeout /t 2 /nobreak >nul
