@echo off
cd /d "%~dp0"
echo === COMMITANDO FIXES ===
echo.
if exist ".git\index.lock" del /f ".git\index.lock"
git add src/App.jsx src/hooks/useData.js src/pages/ClientsPage.jsx src/pages/CRMPage.jsx src/pages/LoginPage.jsx src/pages/PrecificacaoPage.jsx src/pages/TasksPage.jsx src/store/authStore.js src/pages/EsteirasPage.jsx
git commit -m "fix: restaurar arquivos + escopo unificado + rotinas em colunas"
git push origin master
echo.
echo === SE APARECEU "master -> master" ACIMA, DEU CERTO! ===
pause
