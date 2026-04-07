@echo off
echo ========================================
echo       Neon Abyss - Data Converter
echo ========================================
echo.
echo Converting Excel to JSON...
echo.

cd /d "%~dp0"

call npm run convert

echo.
echo ========================================
echo         Conversion Complete!
echo ========================================
echo.
pause
