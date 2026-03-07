@echo off
SET PROJECT_DIR=C:\Users\153758\.gemini\antigravity\scratch\fluxoProd-main
cd /d %PROJECT_DIR%

echo [%date% %time%] Iniciando servicos de background... >> startup.log

:: Inicia o Backend em segundo plano
:: Usamos o caminho completo do node por seguranca
start /b "FluxoProd_Backend" "C:\Program Files\nodejs\node.exe" server/index.js >> backend.log 2>&1

:: Inicia o Frontend em segundo plano
:: Usamos cmd /c npm para garantir que o script .cmd seja encontrado
start /b "FluxoProd_Frontend" cmd /c npm run dev -- --host 0.0.0.0 --port 5173 >> frontend.log 2>&1

echo [%date% %time%] Servicos disparados. >> startup.log
