@echo off
title CashPulse AI - Cash Flow Optimizer
echo ========================================================
echo       CashPulse AI - Minimalist Cash Flow Optimizer
echo ========================================================
echo.
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

echo Starting server on http://127.0.0.1:8050 ...
echo API Documentation at: http://127.0.0.1:8050/docs
echo.
python app.py
pause
