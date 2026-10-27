@echo off
title Deploy CashPulse AI to GitHub
echo ========================================================
echo       Deploy CashPulse AI to GitHub
echo ========================================================
echo.

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH!
    pause
    exit /b 1
)

if not exist .git (
    echo [*] Initializing Git repository on branch main...
    git init -b main
) else (
    echo [*] Git repository active on branch main.
    git branch -M main
)

echo [*] Staging project files...
git add .

echo [*] Committing changes...
git commit -m "feat: initial commit of CashPulse AI - minimalist cash flow optimizer" 2>nul

echo.
echo ========================================================
echo  Next Steps to Deploy to your GitHub:
echo ========================================================
echo 1. Create a new empty repository on GitHub:
echo    https://github.com/new
echo    (e.g., name it 'ai-cash-flow-optimizer')
echo 2. Enter your repository URL below:
echo ========================================================
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/Thedemonofgalaxy/ai-cash-flow-optimizer.git): "

if not "%REPO_URL%"=="" (
    git remote remove origin 2>nul
    git remote add origin %REPO_URL%
    echo.
    echo [*] Pushing to %REPO_URL%...
    git push -u origin main
    if %errorlevel% equ 0 (
        echo.
        echo ========================================================
        echo  [SUCCESS] Project successfully deployed to GitHub!
        echo ========================================================
    ) else (
        echo.
        echo ========================================================
        echo  [NOTICE] If permission was requested, complete the browser login.
        echo  Or push using a Personal Access Token:
        echo  git push https://YOUR_USERNAME:TOKEN@github.com/... main
        echo ========================================================
    )
)

echo.
pause
