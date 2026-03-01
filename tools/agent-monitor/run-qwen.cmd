@echo off
REM run-qwen.cmd - Wrapper script for Qwen CLI agent
REM Usage: run-qwen.cmd "your prompt here"

setlocal enabledelayedexpansion

set "LOGFILE=%~dp0logs\qwen.log"
set "TIMESTAMP=%date% %time%"

REM Ensure logs directory exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Check if prompt argument is provided
if "%~1"=="" (
    echo Usage: run-qwen.cmd "your prompt here"
    exit /b 1
)

REM Log the command being executed
echo [QWEN] [%TIMESTAMP%] Command: qwen %* >> "%LOGFILE%"

REM Run qwen CLI and capture stdout+stderr to log
echo [QWEN] [%TIMESTAMP%] === Session Start === >> "%LOGFILE%"
qwen %* >> "%LOGFILE%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
set "TIMESTAMP=%date% %time%"
echo [QWEN] [%TIMESTAMP%] === Session End (Exit Code: %EXITCODE%) === >> "%LOGFILE%"
echo. >> "%LOGFILE%"

exit /b %EXITCODE%
