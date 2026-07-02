@echo off
cd /d "%~dp0"
echo === CORRIGINDO ARQUIVOS TRUNCADOS ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/hooks/useData.js
git add src/pages/ConfigPage.jsx
git commit -m "fix: restaurar useData.js e ConfigPage.jsx truncados - build Vercel"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo Aguarde 1-2 minutos e verifique fluxebpo.com.br
pause
