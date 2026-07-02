@echo off
cd /d "%~dp0"
echo === CORRIGINDO BUGS 131/132/133 ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/pages/DashPage.jsx
git commit -m "fix: dashboard onboarding mostrava status em vez de etapa (#131)"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo Aguarde 1-2 minutos e atualize fluxebpo.com.br
pause
