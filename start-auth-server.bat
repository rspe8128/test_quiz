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
if "%GEMINI_API_KEY%"=="" if not "%GOOGLE_API_KEY%"=="" set GEMINI_API_KEY=%GOOGLE_API_KEY%
if "%GEMINI_API_KEY%"=="" (
  echo [경고] GEMINI_API_KEY가 없습니다. AI 문제 생성은 실패합니다.
  echo   set GEMINI_API_KEY=AIza... ^(Google AI Studio에서 키 복사^)
  echo.
) else if "%GEMINI_API_KEY:~20,1%"=="" (
  echo [경고] GEMINI_API_KEY가 너무 짧습니다. 잘못된 값일 수 있습니다.
  echo   현재 길이가 짧으면 Windows 환경 변수에 예전 값이 남았을 수 있습니다.
  echo   set GEMINI_API_KEY=AIza... 로 다시 설정한 뒤 이 창에서 bat 실행하세요.
  echo.
) else (
  echo [OK] Gemini API 키 설정됨
)
echo AI 퀴즈 + 로그인 서버: http://127.0.0.1:8787
python server.py
