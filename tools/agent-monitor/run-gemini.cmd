@echo off
REM run-gemini.cmd - Wrapper script for Gemini CLI agent
REM Usage: run-gemini.cmd "your prompt here"

setlocal enabledelayedexpansion

set "LOGFILE=%~dp0logs\gemini.log"
set "TIMESTAMP=%date% %time%"

REM Ensure logs directory exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Check if prompt argument is provided
if "%~1"=="" (
    echo Usage: run-gemini.cmd "your prompt here"
    exit /b 1
)

REM Log the command being executed
echo [GEMINI] [%TIMESTAMP%] Command: gemini %* >> "%LOGFILE%"

REM Run gemini CLI and capture stdout+stderr to log
echo [GEMINI] [%TIMESTAMP%] === Session Start === >> "%LOGFILE%"
gemini %* >> "%LOGFILE%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
set "TIMESTAMP=%date% %time%"
echo [GEMINI] [%TIMESTAMP%] === Session End (Exit Code: %EXITCODE%) === >> "%LOGFILE%"
echo. >> "%LOGFILE%"

exit /b %EXITCODE%
