@echo off
cd /d "%~dp0"

echo Removendo locks do git...
del /f /q ".git\index.lock" 2>nul
del /f /q ".git\HEAD.lock" 2>nul

echo Adicionando arquivos...
git add src/pages/TasksPage.jsx

echo Commitando...
git commit -m "feat: botao Concluir todas na secao de tarefas pendentes anteriores"

echo.
echo Fazendo deploy no Vercel...
npx vercel --prod

echo.
echo PRONTO!
pause
