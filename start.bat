@echo off
echo Starting Psalms Worship PWA...

:: Start Backend
echo Launching Backend...
start "Psalms Backend" cmd /k "cd backend && npm run dev"

:: Start Frontend
echo Launching Frontend...
start "Psalms Frontend" cmd /k "cd frontend && npm run dev"

echo Done! Both servers are starting in separate windows.
pause
