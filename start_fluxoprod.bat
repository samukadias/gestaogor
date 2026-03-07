@echo off
TITLE FluxoProd Startup Script
echo Iniciando servidores FluxoProd...

:: Define o caminho do projeto
SET PROJECT_DIR=C:\Users\153758\.gemini\antigravity\scratch\fluxoProd-main
cd /d %PROJECT_DIR%

:: Inicia o Backend em uma nova janela
echo Iniciando Backend na porta 3000...
start "FluxoProd Backend" cmd /k "node server/index.js"

:: Inicia o Frontend em uma nova janela
echo Iniciando Frontend na porta 5173...
start "FluxoProd Frontend" cmd /k "npm run dev"

echo Servidores em processo de inicializacao! 
echo Nao feche as janelas pretas que abriram.
pause
