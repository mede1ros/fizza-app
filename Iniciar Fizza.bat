@echo off
chcp 65001 >nul
title Fizza (desenvolvimento)
rem Atalho de desenvolvimento no computador. O app de verdade roda no iPhone: https://mede1ros.github.io/fizza-app/
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org ^(versao LTS^) e rode este arquivo de novo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Instalando dependencias ^(so na primeira vez, pode levar alguns minutos^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [ERRO] Falha no npm install.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando o Fizza em http://localhost:5173/fizza-app/
echo Feche esta janela para encerrar o app.
echo.
start "" cmd /c "timeout /t 4 >nul & start http://localhost:5173/fizza-app/"
call npm run dev -- --port 5173 --strictPort
pause
