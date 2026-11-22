@echo off
title Think Tank Floor Tapper Launcher
cd /d "%~dp0"
echo Starting Think Tank Auto-Tapper...
python think_tank_autoclicker.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Python encountered an error or is not in PATH.
    pause
)
