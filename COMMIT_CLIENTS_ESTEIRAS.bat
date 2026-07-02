@echo off
cd /d "%~dp0"
echo === COMMITANDO CLIENTSPAGE + ESTEIRASPAGE ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/pages/ClientsPage.jsx src/pages/EsteirasPage.jsx
git commit -m "fix: ClientsPage restaurado (truncado) + EsteirasPage fecha funcao"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
