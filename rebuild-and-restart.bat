@echo off
setlocal

REM LocalCart Docker rebuild + restart wrapper
REM Run from repo root: rebuild-and-restart.bat

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0rebuild-and-restart.ps1" %*
if errorlevel 1 (
  echo.
  echo Rebuild/restart failed. Check logs above.
  exit /b %errorlevel%
)

echo.
echo Rebuild/restart completed successfully.
exit /b 0
