@echo off
REM start.cmd - Launch Agent Monitor Server and open dashboard in browser
REM This starts the Node.js server and opens http://localhost:3333

echo Starting Agent Monitor Server...
echo.

REM Start server in background and open browser
start "" node "%~dp0server.js"
timeout /t 2 /nobreak >nul

REM Open dashboard in default browser
start http://localhost:3333

echo.
echo Dashboard opened in your browser at http://localhost:3333
echo.
echo Server is running in a separate window.
echo Close that window to stop the server.
