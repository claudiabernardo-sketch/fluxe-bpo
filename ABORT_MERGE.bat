@echo off
cd /d "%~dp0"
echo === ABORTANDO MERGE PENDENTE ===
echo.
if exist ".git\index.lock" (
    del /f ".git\index.lock"
    echo Lock removido.
)
git merge --abort
echo.
echo === STATUS ATUAL ===
git status
echo.
pause
