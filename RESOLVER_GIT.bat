@echo off
cd /d "C:\Users\Cliente\Downloads\fluxe-bpo"

echo Cancelando processo travado...
git rebase --abort 2>nul

echo Removendo arquivos que causam conflito...
del /f /q "src\pages\AprovPage.jsx" 2>nul
del /f /q "src\pages\DrePage.jsx" 2>nul
del /f /q "src\pages\PrecificacaoPage.jsx" 2>nul

echo Limpando stash...
git stash drop 2>nul

echo Baixando atualizacoes do GitHub...
git pull origin master

echo Subindo suas correcoes...
git push origin master

echo.
echo === PRONTO! Verifique acima se apareceu "master -> master" ===
pause
