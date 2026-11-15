@echo off
title AetherField AI Video Studio + MCP Hub
echo Starting AetherField AI Video Studio on http://localhost:3456 ...
start http://localhost:3456
node "%~dp0server.js"
pause
