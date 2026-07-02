@echo off
cd /d "%~dp0"
echo === COMMITANDO PACKAGE-LOCK.JSON ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add package-lock.json
git commit -m "fix: adicionar package-lock.json com vite 5.4.21"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo O Vercel vai buildar com as versoes corretas agora.
pause
