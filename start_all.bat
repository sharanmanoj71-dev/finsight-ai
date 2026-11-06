@echo off
echo ==============================================================
echo           Starting FinSight AI Full-Stack Platform
echo ==============================================================
echo 1. Launching FastAPI Backend on http://127.0.0.1:8000
start "FinSight AI Backend" cmd /c "%~dp0run_backend.bat"

echo 2. Launching Vite React Frontend on http://localhost:5173
start "FinSight AI Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo Both servers are launching in separate windows!
echo Open your browser to: http://localhost:5173
echo ==============================================================
