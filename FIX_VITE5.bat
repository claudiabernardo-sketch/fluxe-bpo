@echo off
cd /d "%~dp0"
echo === REGENERANDO LOCKFILE COM VITE 5 ===
echo.

if exist ".git\index.lock" del /f ".git\index.lock"

echo [1/4] Deletando package-lock.json e node_modules...
if exist package-lock.json del /f package-lock.json
if exist node_modules rmdir /s /q node_modules
echo.

echo [2/4] Instalando dependencias com Vite 5...
npm install
if errorlevel 1 (
  echo ERRO no npm install. Verifique sua conexao e tente novamente.
  pause
  exit /b 1
)
echo.

echo [3/4] Commitando lockfile novo...
git add package-lock.json
git add package.json
git commit -m "fix: regenera lockfile com vite 5 (remove rolldown)"
echo.

echo [4/4] Enviando para GitHub...
git push origin master
echo.

echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo O Vercel vai deployar automaticamente com Vite 5.
pause
