@echo off
cd /d "%~dp0"
echo === AJUSTES PRECIFICACAO: remover folha + mascara BRL ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/pages/PrecificacaoPage.jsx
git commit -m "fix: remover campo folha + mascarar campos R$ na PrecificacaoPage"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
echo Aguarde 1-2 minutos e atualize fluxebpo.com.br
pause
