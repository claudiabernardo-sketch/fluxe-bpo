@echo off
cd /d "%~dp0"
echo === COMMITANDO ESTEIRASPAGE FIX ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/pages/EsteirasPage.jsx
git commit -m "fix: EsteirasPage — fecha chave da funcao"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
