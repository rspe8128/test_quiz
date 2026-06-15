#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 퀴즈 생성 프록시 서버 (Gemini API)

사용법:
  set GEMINI_API_KEY=AQ....
  python server.py

기본 주소: http://localhost:8787

환경 변수:
  GEMINI_API_KEY / GOOGLE_API_KEY — 필수 (GOOGLE_API_KEY 우선)
  AI_QUIZ_PORT    — 기본 8787
  AI_QUIZ_HOST    — 기본 127.0.0.1 (다른 PC에서 접속 시 0.0.0.0)
  AI_QUIZ_MODEL   — 기본 gemini-2.0-flash
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(ROOT, "presets.json")

HOST = os.environ.get("AI_QUIZ_HOST") or ("0.0.0.0" if os.environ.get("PORT") else "127.0.0.1")
PORT = int(os.environ.get("PORT", os.environ.get("AI_QUIZ_PORT", "8787")))
API_KEY = (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY") or "").strip()
MODEL = os.environ.get("AI_QUIZ_MODEL", "gemini-2.0-flash")
API_BASE = "https://generativelanguage.googleapis.com/v1beta"


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
    server_version = "AIQuizProxy/2.0"

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

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") in ("", "/health"):
            self._json(
                200,
                {
                    "ok": True,
                    "provider": "gemini",
                    "model": MODEL,
                    "has_key": bool(API_KEY),
                },
            )
            return
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path.rstrip("/") != "/generate":
            self._json(404, {"error": "not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
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


def main():
    if not API_KEY:
        print(
            "경고: GEMINI_API_KEY(또는 GOOGLE_API_KEY)가 없습니다. /generate 요청은 실패합니다.",
            file=sys.stderr,
        )
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"AI 퀴즈 서버 (Gemini) → http://{HOST}:{PORT}")
    print(f"모델: {MODEL}")
    print("헬스체크: GET /health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n종료")
        httpd.server_close()


if __name__ == "__main__":
    main()
