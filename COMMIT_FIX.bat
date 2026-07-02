@echo off
cd /d "%~dp0"
echo === COMMITANDO FIXES SEM NPM INSTALL ===
echo.

if exist ".git\index.lock" del /f ".git\index.lock"

git add package.json vercel.json
git status
echo.

git commit -m "fix: xlsx do npm registry, buildCommand simplificado"
echo.

git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
