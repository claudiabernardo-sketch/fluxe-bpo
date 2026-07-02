@echo off
cd /d "%~dp0"
echo Deployando fix do vincular...
npx vercel --prod --yes
pause
