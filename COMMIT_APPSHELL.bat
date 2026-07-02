@echo off
cd /d "%~dp0"
echo === COMMITANDO APPSHELL CORRIGIDO ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/components/layout/AppShell.jsx
git commit -m "fix: AppShell.jsx truncado — completa nav mobile"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
