@echo off
chcp 65001 >nul
cd /d "%~dp0ai-quiz-server"
if "%AUTH_ADMIN_PASSWORD%"=="" (
  echo [오류] 비밀번호가 없습니다.
  echo   set AUTH_ADMIN_PASSWORD=본인비밀번호
  echo   를 먼저 실행한 뒤 다시 이 파일을 실행하세요.
  pause
  exit /b 1
)
if "%AUTH_ADMIN_USERNAME%"=="" set AUTH_ADMIN_USERNAME=rspe
if "%AUTH_ADMIN_DISPLAY%"=="" set AUTH_ADMIN_DISPLAY=유노 남친
set AI_QUIZ_HOST=127.0.0.1
echo AI 퀴즈 + 로그인 서버: http://127.0.0.1:8787
python server.py
