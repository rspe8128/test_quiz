#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 퀴즈 + 회원 인증 서버 (Gemini API)

환경 변수:
  GEMINI_API_KEY / GOOGLE_API_KEY — Gemini API 키
  AUTH_ADMIN_USERNAME — 관리자 아이디 (기본 rspe)
  AUTH_ADMIN_PASSWORD — 관리자 비밀번호 (필수, Render에만 설정)
  AUTH_ADMIN_DISPLAY  — 관리자 표시 이름 (기본 유노 남친)
  AUTH_DB_PATH        — SQLite 경로 (기본 auth.db, Render 디스크는 /var/data/site.db)
  TURSO_DATABASE_URL  — Turso URL (무료 플랜 영구 저장, 선택)
  TURSO_AUTH_TOKEN    — Turso 토큰 (선택)
  AI_QUIZ_HOST        — 0.0.0.0 (Render)
  AI_QUIZ_MODEL       — gemini-2.0-flash
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import auth_store
import ai_quiz_store
import db
import requests_store

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "presets.json")

HOST = os.environ.get("AI_QUIZ_HOST") or ("0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
PORT = int(os.environ.get("PORT", os.environ.get("AI_QUIZ_PORT", "8787")))
API_KEY = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
MODEL = os.environ.get("AI_QUIZ_MODEL", "gemini-2.0-flash")
API_BASE = "https://generativelanguage.googleapis.com/v1beta"

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,24}$")


def load_presets() -> dict:
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


def fill_template(tpl: str, **kwargs) -> str:
    def repl(m):
        return str(kwargs.get(m.group(1), ""))

    return re.sub(r"\{\{(\w+)\}\}", repl, tpl)


def call_llm(system: str, user: str) -> list:
    if not API_KEY:
        raise RuntimeError("GEMINI_API_KEY 또는 GOOGLE_API_KEY 환경 변수가 설정되지 않았습니다.")

    payload = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }
    url = f"{API_BASE}/models/{MODEL}:generateContent"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini API 오류 ({e.code}): {detail[:400]}") from e

    candidates = body.get("candidates") or []
    if not candidates:
        block = (body.get("promptFeedback") or {}).get("blockReason")
        raise RuntimeError(f"AI 응답이 비어 있습니다.{f' (차단: {block})' if block else ''}")

    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise RuntimeError("AI 응답 텍스트가 비어 있습니다.")

    parsed = json.loads(text)
    return parsed.get("items") or parsed.get("questions") or []


class Handler(BaseHTTPRequestHandler):
    server_version = "AIQuizProxy/3.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _json(self, code: int, obj: dict):
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict | None:
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            return None

    def _bearer_token(self) -> str:
        auth = self.headers.get("Authorization", "")
        if auth.lower().startswith("bearer "):
            return auth[7:].strip()
        return ""

    def _current_user(self) -> dict | None:
        return auth_store.get_user_by_token(self._bearer_token())

    def _require_user(self, *, approved_only: bool = True) -> dict | None:
        user = self._current_user()
        if not user:
            self._json(401, {"error": "로그인이 필요합니다."})
            return None
        if approved_only and user["role"] != "admin" and user["status"] != "approved":
            self._json(403, {"error": "관리자 승인 후 이용할 수 있습니다.", "status": user["status"]})
            return None
        return user

    def _require_admin(self) -> dict | None:
        user = self._current_user()
        if not user:
            self._json(401, {"error": "로그인이 필요합니다."})
            return None
        if user["role"] != "admin":
            self._json(403, {"error": "관리자만 접근할 수 있습니다."})
            return None
        return user

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path.rstrip("/") or "/"
        query = parse_qs(urlparse(self.path).query)

        if path in ("/", "/health"):
            self._json(
                200,
                {
                    "ok": True,
                    "provider": "gemini",
                    "model": MODEL,
                    "has_key": bool(API_KEY),
                    "auth": True,
                    "db": db.db_info(),
                },
            )
            return

        if path == "/auth/me":
            user = self._current_user()
            if not user:
                self._json(401, {"error": "로그인이 필요합니다."})
                return
            self._json(200, {"user": user})
            return

        if path == "/admin/users":
            if not self._require_admin():
                return
            status = (query.get("status") or [None])[0]
            users = auth_store.list_users(status)
            self._json(200, {"users": users})
            return

        if path == "/admin/name-changes":
            if not self._require_admin():
                return
            self._json(200, {"users": auth_store.list_name_changes()})
            return

        if path == "/hall-of-fame":
            self._json(200, {"members": auth_store.list_vip_hall()})
            return

        if path == "/ai-quiz/data":
            user = self._require_user(approved_only=True)
            if not user:
                return
            app_id = (query.get("appId") or [""])[0]
            if not app_id:
                self._json(400, {"error": "appId required"})
                return
            self._json(200, ai_quiz_store.get_data(user["id"], app_id))
            return

        if path == "/admin/ai-stats":
            if not self._require_admin():
                return
            self._json(200, {"users": ai_quiz_store.list_user_stats()})
            return

        if path == "/admin/ai-stats/user":
            if not self._require_admin():
                return
            user_id = int((query.get("userId") or ["0"])[0])
            detail = ai_quiz_store.get_user_detail(user_id)
            if not detail:
                self._json(404, {"error": "사용자를 찾을 수 없습니다."})
                return
            self._json(200, {"user": detail})
            return

        if path == "/requests/mine":
            user = self._require_user(approved_only=True)
            if not user:
                return
            self._json(200, {"requests": requests_store.list_for_user(user["id"])})
            return

        if path == "/admin/requests":
            if not self._require_admin():
                return
            status = (query.get("status") or [None])[0]
            self._json(200, {"requests": requests_store.list_for_admin(status)})
            return

        if path.startswith("/requests/") and path.count("/") >= 3:
            parts = path.split("/")
            if len(parts) >= 5 and parts[3] == "files":
                request_id = int(parts[2] or 0)
                file_id = int(parts[4] or 0)
                user = self._require_user(approved_only=False)
                if not user:
                    return
                req = requests_store.get_request(request_id)
                if not req:
                    self._json(404, {"error": "요청을 찾을 수 없습니다."})
                    return
                if user["role"] != "admin" and req["userId"] != user["id"]:
                    self._json(403, {"error": "권한이 없습니다."})
                    return
                f = requests_store.get_file(request_id, file_id)
                if not f:
                    self._json(404, {"error": "파일을 찾을 수 없습니다."})
                    return
                self._json(200, {"file": f})
                return

        if path.startswith("/requests/"):
            request_id = int(path.split("/")[-1] or 0)
            user = self._require_user(approved_only=False)
            if not user:
                return
            req = requests_store.get_request(request_id)
            if not req:
                self._json(404, {"error": "요청을 찾을 수 없습니다."})
                return
            if user["role"] != "admin" and req["userId"] != user["id"]:
                self._json(403, {"error": "권한이 없습니다."})
                return
            if user["role"] == "admin" and req["status"] == "pending":
                req = requests_store.mark_read(request_id) or req
            self._json(200, {"request": req})
            return

        self._json(404, {"error": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path.rstrip("/") or "/"
        data = self._read_json()
        if data is None:
            self._json(400, {"error": "invalid json"})
            return

        if path == "/auth/register":
            username = str(data.get("username") or "").strip().lower()
            password = str(data.get("password") or "")
            display_name = str(data.get("displayName") or username).strip()

            if not USERNAME_RE.match(username):
                self._json(
                    400,
                    {"error": "아이디는 영문 소문자·숫자·밑줄 3~24자여야 합니다."},
                )
                return
            if len(password) < 6:
                self._json(400, {"error": "비밀번호는 6자 이상이어야 합니다."})
                return
            if auth_store.get_user_by_username(username):
                self._json(409, {"error": "이미 사용 중인 아이디입니다."})
                return

            user = auth_store.create_user(username, password, display_name)
            token = auth_store.create_session(user["id"])
            self._json(201, {"token": token, "user": user})
            return

        if path == "/auth/login":
            username = str(data.get("username") or "").strip().lower()
            password = str(data.get("password") or "")
            user = auth_store.authenticate(username, password)
            if not user:
                self._json(401, {"error": "아이디 또는 비밀번호가 올바르지 않습니다."})
                return
            token = auth_store.create_session(user["id"])
            self._json(200, {"token": token, "user": user})
            return

        if path == "/auth/logout":
            token = self._bearer_token()
            if token:
                auth_store.delete_session(token)
            self._json(200, {"ok": True})
            return

        if path == "/auth/profile/display-name":
            user = self._require_user(approved_only=True)
            if not user:
                return
            display_name = str(data.get("displayName") or "").strip()
            if not display_name:
                self._json(400, {"error": "표시 이름을 입력해 주세요."})
                return
            try:
                updated = auth_store.request_display_name(user["id"], display_name)
            except ValueError as e:
                self._json(400, {"error": str(e)})
                return
            if not updated:
                self._json(404, {"error": "사용자를 찾을 수 없습니다."})
                return
            if updated["role"] == "admin":
                self._json(200, {"user": updated, "message": "이름이 변경되었습니다."})
                return
            self._json(
                200,
                {
                    "user": updated,
                    "message": "이름 변경 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.",
                },
            )
            return

        if path == "/admin/approve":
            if not self._require_admin():
                return
            user_id = int(data.get("userId") or 0)
            target = auth_store.get_user_by_id(user_id)
            if not target or target["role"] == "admin":
                self._json(404, {"error": "사용자를 찾을 수 없습니다."})
                return
            user = auth_store.set_user_status(user_id, "approved")
            self._json(200, {"user": user})
            return

        if path == "/admin/reject":
            if not self._require_admin():
                return
            user_id = int(data.get("userId") or 0)
            target = auth_store.get_user_by_id(user_id)
            if not target or target["role"] == "admin":
                self._json(404, {"error": "사용자를 찾을 수 없습니다."})
                return
            user = auth_store.set_user_status(user_id, "rejected")
            self._json(200, {"user": user})
            return

        if path == "/admin/approve-name":
            if not self._require_admin():
                return
            user_id = int(data.get("userId") or 0)
            user = auth_store.approve_display_name(user_id)
            if not user:
                self._json(404, {"error": "대기 중인 이름 변경이 없습니다."})
                return
            self._json(200, {"user": user})
            return

        if path == "/admin/reject-name":
            if not self._require_admin():
                return
            user_id = int(data.get("userId") or 0)
            user = auth_store.reject_display_name(user_id)
            if not user:
                self._json(404, {"error": "대기 중인 이름 변경이 없습니다."})
                return
            self._json(200, {"user": user})
            return

        if path == "/admin/set-vip":
            if not self._require_admin():
                return
            user_id = int(data.get("userId") or 0)
            if "vip" not in data:
                self._json(400, {"error": "vip 값이 필요합니다."})
                return
            raw_vip = data.get("vip")
            if isinstance(raw_vip, bool):
                vip = raw_vip
            else:
                vip = str(raw_vip).lower() in ("1", "true", "yes")
            target = auth_store.get_user_by_id(user_id)
            if not target or target["role"] == "admin":
                self._json(404, {"error": "사용자를 찾을 수 없습니다."})
                return
            user = auth_store.set_user_vip(user_id, vip)
            self._json(200, {"user": user})
            return

        if path == "/vip/profile":
            user = self._require_user(approved_only=True)
            if not user:
                return
            if user["role"] != "vip":
                self._json(403, {"error": "VIP 계정만 프로필을 수정할 수 있습니다."})
                return
            avatar = data.get("avatar")
            message = data.get("message")
            if avatar is not None and not isinstance(avatar, str):
                avatar = None
            if message is not None and not isinstance(message, str):
                message = None
            try:
                updated = auth_store.update_vip_profile(
                    user["id"],
                    avatar=avatar,
                    message=message,
                )
            except ValueError as e:
                self._json(400, {"error": str(e)})
                return
            self._json(200, {"user": updated, "message": "프로필이 저장되었습니다."})
            return

        if path == "/requests":
            user = self._require_user(approved_only=True)
            if not user:
                return
            category = str(data.get("category") or "other")
            title = str(data.get("title") or "")
            body = str(data.get("body") or "")
            files = data.get("files") or []
            if not isinstance(files, list):
                files = []
            try:
                req = requests_store.create_request(user["id"], category, title, body, files)
            except ValueError as e:
                self._json(400, {"error": str(e)})
                return
            self._json(201, {"request": req, "message": "요청이 전송되었습니다."})
            return

        if path == "/ai-quiz/data":
            user = self._require_user(approved_only=True)
            if not user:
                return
            app_id = str(data.get("appId") or "").strip()
            if not app_id:
                self._json(400, {"error": "appId required"})
                return
            items = data.get("items")
            prog = data.get("prog")
            saved = ai_quiz_store.save_data(user["id"], app_id, items, prog)
            self._json(200, saved)
            return

        if path == "/admin/requests/reply":
            if not self._require_admin():
                return
            request_id = int(data.get("requestId") or 0)
            reply = str(data.get("reply") or "")
            status = str(data.get("status") or "replied")
            try:
                req = requests_store.reply_request(request_id, reply, status)
            except ValueError as e:
                self._json(400, {"error": str(e)})
                return
            if not req:
                self._json(404, {"error": "요청을 찾을 수 없습니다."})
                return
            self._json(200, {"request": req, "message": "답변을 보냈습니다."})
            return

        if path == "/generate":
            if not self._require_user(approved_only=True):
                return

            preset_key = str(data.get("preset") or "generic")
            topic = str(data.get("topic") or "").strip()
            count = max(1, min(15, int(data.get("count") or 5)))

            if not topic:
                self._json(400, {"error": "topic required"})
                return

            presets = load_presets()
            preset = presets.get(preset_key) or presets["generic"]

            try:
                items = call_llm(
                    preset["system"],
                    fill_template(preset["userTemplate"], topic=topic, count=count),
                )
                self._json(200, {"items": items})
            except Exception as e:
                self._json(500, {"error": str(e)})
            return

        self._json(404, {"error": "not found"})


def main():
    db.warmup()
    auth_store.init_db()
    requests_store.init_requests_db()
    ai_quiz_store.init_ai_quiz_db()
    if not API_KEY:
        print(
            "경고: GEMINI_API_KEY(또는 GOOGLE_API_KEY)가 없습니다. /generate 요청은 실패합니다.",
            file=sys.stderr,
        )
    if not auth_store.ADMIN_PASSWORD:
        print(
            "경고: AUTH_ADMIN_PASSWORD가 없습니다. 관리자 계정이 생성되지 않습니다.",
            file=sys.stderr,
        )
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"AI 퀴즈 서버 (Gemini + Auth) → http://{HOST}:{PORT}")
    print(f"모델: {MODEL}")
    print(f"DB: {db.persistence_hint()}")
    print("헬스체크: GET /health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n종료")
        db.flush()
        httpd.server_close()


if __name__ == "__main__":
    main()
