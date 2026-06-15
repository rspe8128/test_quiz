@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 사이트 로컬 미리보기: http://127.0.0.1:8080/index.html
echo (로그인 API는 start-auth-server.bat 도 함께 실행해야 합니다)
python -m http.server 8080
