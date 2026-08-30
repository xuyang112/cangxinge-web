@echo off
setlocal EnableExtensions
title DeepSeek Harness Launcher

rem ============================================================
rem  DeepSeek Harness 一键启动器
rem  双击运行：若 Harness 已在运行则直接打开浏览器；
rem  否则启动 web 服务，并在就绪后自动打开浏览器。
rem  关闭 "DeepSeek Harness" 控制台窗口即可停止服务。
rem ============================================================

set "URL=http://127.0.0.1:3080"
set "NODE=C:\Program Files\nodejs\node.exe"
set "DSH_BIN=C:\Users\orange\AppData\Local\npm-cache\_npx\1e7f6d9597241db0\node_modules\@deepseek-ai\dsh\lib\bin.js"

rem ---- 1. 若服务已在运行，直接打开浏览器 ----
netstat -ano | findstr /R /C:"127\.0\.0\.1:3080 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    start "" "%URL%"
    exit /b 0
)

rem ---- 2. 启动 Harness web 服务（独立控制台窗口）----
if exist "%DSH_BIN%" (
    start "DeepSeek Harness" "%NODE%" "%DSH_BIN%" web
) else (
    start "DeepSeek Harness" cmd /k "npx --yes @deepseek-ai/dsh web"
)

rem ---- 3. 等待服务就绪（最多 40 秒）----
set /a tries=0
:wait
netstat -ano | findstr /R /C:"127\.0\.0\.1:3080 .*LISTENING" >nul 2>&1
if not errorlevel 1 goto up
set /a tries+=1
if %tries% geq 40 goto giveup
timeout /t 1 /nobreak >nul
goto wait

:up
start "" "%URL%"
exit /b 0

:giveup
echo.
echo Harness 未能在 40 秒内启动，请查看 "DeepSeek Harness" 窗口中的错误信息。
echo.
pause
exit /b 1
