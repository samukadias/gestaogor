@echo off
set PROJECT_DIR=C:\Users\153758\.gemini\antigravity\scratch\fluxoProd-main
cd /d %PROJECT_DIR%
pm2 start server/index.js --name "FluxoProd-Backend"
pm2 start npm --name "FluxoProd-Frontend" -- run dev
pm2 save
