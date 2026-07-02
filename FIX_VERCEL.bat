@echo off
cd /d "%~dp0"
echo === CORRIGINDO XLSX + VERCEL BUILD ===
echo.

if exist ".git\index.lock" del /f ".git\index.lock"

echo [1/4] Deletando lockfile e node_modules...
if exist package-lock.json del /f package-lock.json
if exist node_modules rmdir /s /q node_modules
echo.

echo [2/4] Instalando com xlsx do npm (sem CDN)...
npm install
if errorlevel 1 (
  echo ERRO no npm install!
  pause
  exit /b 1
)
echo.

echo [3/4] Commitando...
git add package.json vercel.json package-lock.json
git commit -m "fix: xlsx do npm registry, buildCommand simplificado"
echo.

echo [4/4] Enviando para GitHub...
git push origin master
echo.

echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
