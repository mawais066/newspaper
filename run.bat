@echo off
title AwaisNews Server
cd /d "%~dp0"
echo ===================================================
echo           AWAISNEWS - GLOBAL AI NEWSPAPER
echo ===================================================
echo Starting AwaisNews Python Server on http://localhost:8000 ...
start "" http://localhost:8000
python app.py
pause
