@echo off
set PROJECT_DIR=%~dp0
cd /d %PROJECT_DIR%
pm2 start server/index.js --name "GestaoGOR-Backend"
pm2 start npm --name "GestaoGOR-Frontend" -- run dev
pm2 save
