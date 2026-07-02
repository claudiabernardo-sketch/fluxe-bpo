@echo off
cd /d "%~dp0"
echo === CORRIGINDO EsteirasPage.jsx (div extra) ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/pages/EsteirasPage.jsx
git commit -m "fix: remover div extra em EsteirasPage que quebrava build do Vercel"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo O Vercel vai buildar em 1-2 minutos — verifique fluxebpo.com.br
pause
