@echo off
cd /d "%~dp0"
echo === CORRIGINDO vite.config.js (circular chunk react) ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add vite.config.js
git commit -m "fix: remover chunk react separado - causava circular dependency e tela branca"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo Aguarde 1-2 minutos e atualize fluxebpo.com.br
pause
