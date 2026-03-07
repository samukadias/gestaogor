@echo off
TITLE Gestão GOR Startup Script
echo Iniciando servidores Gestão GOR...

:: Define o caminho do projeto relativo à pasta atual
SET PROJECT_DIR=%~dp0
cd /d %PROJECT_DIR%

:: Inicia o Backend em uma nova janela
echo Iniciando Backend na porta 3000...
start "GestaoGOR Backend" cmd /k "node server/index.js"

:: Inicia o Frontend em uma nova janela
echo Iniciando Frontend na porta 5173...
start "GestaoGOR Frontend" cmd /k "npm run dev"

echo Servidores em processo de inicializacao! 
echo Nao feche as janelas pretas que abriram.
pause
