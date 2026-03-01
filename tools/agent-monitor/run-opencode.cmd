@echo off
REM run-opencode.cmd - Wrapper script for OpenCode agent
REM Usage: run-opencode.cmd "your prompt here"

setlocal enabledelayedexpansion

set "LOGFILE=%~dp0logs\opencode.log"
set "TIMESTAMP=%date% %time%"

REM Ensure logs directory exists
if not exist "%~dp0logs" mkdir "%~dp0logs"

REM Check if prompt argument is provided
if "%~1"=="" (
    echo Usage: run-opencode.cmd "your prompt here"
    exit /b 1
)

REM Log the command being executed
echo [OPENCODE] [%TIMESTAMP%] Command: opencode %* >> "%LOGFILE%"

REM Run opencode CLI and capture stdout+stderr to log
echo [OPENCODE] [%TIMESTAMP%] === Session Start === >> "%LOGFILE%"
opencode %* >> "%LOGFILE%" 2>&1
set "EXITCODE=%ERRORLEVEL%"
set "TIMESTAMP=%date% %time%"
echo [OPENCODE] [%TIMESTAMP%] === Session End (Exit Code: %EXITCODE%) === >> "%LOGFILE%"
echo. >> "%LOGFILE%"

exit /b %EXITCODE%
