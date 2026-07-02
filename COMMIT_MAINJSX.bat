@echo off
cd /d "%~dp0"
echo === CORRIGINDO main.jsx + excel.js (null bytes) ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/main.jsx src/utils/excel.js
git commit -m "fix: restaurar main.jsx e excel.js corrompidos (null bytes)"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo O Vercel vai buildar agora — aguarde 1-2 minutos.
pause
