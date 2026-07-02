@echo off
cd /d "%~dp0"
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/pages/ClientsPage.jsx
git commit -m "fix: rotina em colunas por dia, escopo simplificado"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
