@echo off
echo ========================================================
echo Starting Digital Dark Spot (Shinchan Hackathon 2026)
echo ========================================================

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Digital Dark Spot - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "Digital Dark Spot - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul
echo Opening application in browser...
start http://localhost:5173

echo.
echo Both servers are now running!
echo - Frontend: http://localhost:5173
echo - Backend:  http://127.0.0.1:8000
echo ========================================================

