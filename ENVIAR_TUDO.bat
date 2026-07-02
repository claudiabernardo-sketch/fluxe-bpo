@echo off
cd /d "%~dp0"
echo === ENVIANDO TODAS AS MUDANCAS PARA O SITE ===
echo.

rem Remove locks caso existam
if exist ".git\index.lock" del /f ".git\index.lock"
if exist ".git\HEAD.lock" del /f ".git\HEAD.lock"

rem Commita DashPage (o PrecificacaoPage ja foi commitado)
git add src/pages/DashPage.jsx
git commit -m "fix: dashboard onboarding mostrava status em vez de etapa (#131)"

rem Envia tudo para o GitHub (Vercel faz deploy automatico)
git push origin master

echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo Aguarde 1-2 minutos e atualize fluxebpo.com.br
pause
